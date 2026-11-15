"""Service gốc cho CRUD: hợp đồng giữa CoreModelViewSet và tầng nghiệp vụ.

Lớp con chỉ **khai báo**; chỉ ghi đè `create`/`update`/`delete` khi có quy tắc nghiệp vụ:

```python
class ShortLinkService(CoreCrudService[ShortLink, ShortLinkRepository]):
    repository_class = ShortLinkRepository
    owner_field = "owner"                                         # None = tài nguyên chung
    manage_all_permission = ShortLinksPermission.MANAGE_ALL.code  # có quyền này thì thấy mọi owner
    owner_quota_setting = "SHORT_LINK_MAX_PER_OWNER"              # tổng tối đa mỗi owner (None = không)
```

- `*_for(actor)` lọc theo owner; bản ghi của người khác trả 404 (không lộ tồn tại).
- `update`/`delete` khóa dòng (bản ghi đã xóa mềm = không tồn tại) rồi kiểm owner; `delete` là xóa mềm.
- `bulk_update`/`bulk_delete` chạy một transaction, khóa theo thứ tự id, gọi lại `update`/`delete`
  nên luật riêng của lớp con tự áp cho thao tác hàng loạt.
- Kiểm quyền `manage_all` bằng `actor.has_perm()` (Django hỏi `IamPermissionBackend`)
  nên core không import IAM.
"""

from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models import QuerySet

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.repositories.core_repository import CoreRepository
from app.core.tracking.journal_tracker import JournalTracker


class CoreCrudService[M: models.Model, R: CoreRepository[Any]]:
    """CRUD mặc định ủy quyền cho repository.

    Type params:
        M: Model.
        R: Lớp repository (để service con dùng method riêng của repository mà vẫn đúng kiểu).

    Attributes:
        repository_class: Lớp repository của model.
        owner_field: Tên FK owner (`owner`, `created_by`); None = tài nguyên chung.
        manage_all_permission: Mã quyền mở phạm vi sang mọi owner.
        owner_quota_setting: Tên setting chứa số bản ghi tối đa mỗi owner.
        repository: Repository của model.
    """

    repository_class: type[R]
    owner_field: str | None = None
    manage_all_permission: str | None = None
    owner_quota_setting: str | None = None

    def __init__(self, repository: R | None = None) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository (test có thể truyền bản giả).
        """
        self.repository: R = repository or self.repository_class()

    # ==================================================================
    # Đọc
    # ==================================================================
    def get_queryset(self) -> QuerySet[M]:
        """Queryset gốc không lọc theo actor (dùng nội bộ giữa các service)."""
        return self.repository.get_queryset()

    def get_by_id(self, pk: Any) -> M:
        """Chi tiết không lọc theo actor (dùng nội bộ).

        Raises:
            NotFoundError: Không tồn tại.
        """
        return self.repository.get_by_id(pk)

    def get_queryset_for(self, actor: Any) -> QuerySet[M]:
        """Queryset actor được thấy (view áp filter/search/ordering/pagination lên đây).

        Args:
            actor: Người dùng hiện tại.

        Returns:
            QuerySet.
        """
        queryset = self.get_queryset()
        if self.owner_field is None or self.can_manage_all(actor):
            return queryset
        return queryset.filter(**{f"{self.owner_field}_id": actor.pk})

    def get_by_id_for(self, actor: Any, pk: Any) -> M:
        """Chi tiết actor được thấy.

        Raises:
            NotFoundError: Không tồn tại hoặc thuộc người khác.
        """
        instance = self.get_by_id(pk)
        if not self.can_access(actor, instance):
            raise NotFoundError()
        return instance

    def can_manage_all(self, actor: Any) -> bool:
        """Actor thấy được tài nguyên của mọi owner.

        Args:
            actor: Người dùng.

        Returns:
            True nếu không có owner hoặc actor có quyền `manage_all`.
        """
        if self.owner_field is None:
            return True
        return bool(self.manage_all_permission and actor.has_perm(self.manage_all_permission))

    def can_access(self, actor: Any, instance: M) -> bool:
        """Actor là owner hoặc có quyền `manage_all`.

        Args:
            actor: Người dùng.
            instance: Bản ghi.

        Returns:
            True nếu được truy cập.
        """
        if self.owner_field is None:
            return True
        return getattr(instance, f"{self.owner_field}_id", None) == actor.pk or self.can_manage_all(actor)

    def get_owner_id(self, instance: M) -> Any:
        """Id owner của bản ghi (None nếu tài nguyên chung)."""
        return getattr(instance, f"{self.owner_field}_id", None) if self.owner_field else None

    # ==================================================================
    # Ghi
    # ==================================================================
    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> M:
        """Tạo bản ghi; tài nguyên có owner thì owner = actor (client không gửi owner).

        Args:
            actor: Người thực hiện.
            data: Dữ liệu đã validate.

        Returns:
            Bản ghi mới.

        Raises:
            ConflictError: Vượt quota của owner.
        """
        fields = dict(data)
        if self.owner_field and self.owner_field not in fields and self.owner_field != "created_by":
            fields[self.owner_field] = actor
        self.ensure_quota(actor)
        return self.repository.create(actor=actor, **fields)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> M:
        """Khóa dòng, kiểm owner rồi cập nhật.

        Args:
            actor: Người thực hiện.
            pk: Khóa chính.
            data: Dữ liệu đã validate (partial).

        Returns:
            Bản ghi sau cập nhật.
        """
        instance = self.get_for_write(actor, pk)
        return self.repository.update(instance, actor=actor, **data)

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Khóa dòng, kiểm owner rồi **xóa mềm**. Tài nguyên thực sự cần xóa cứng thì lớp con ghi đè
        và gọi `self.repository.hard_delete(...)` tường minh.

        Args:
            actor: Người thực hiện.
            pk: Khóa chính.
        """
        instance = self.get_for_write(actor, pk)
        self.repository.delete(instance, actor=actor)

    @transaction.atomic
    def bulk_update(self, actor: Any, ids: list[Any], data: dict[str, Any]) -> int:
        """Cập nhật cả lô; lỗi một bản ghi thì không bản ghi nào đổi.

        Args:
            actor: Người thực hiện.
            ids: Id bản ghi (≤ 100, đã bỏ trùng).
            data: Trường cần cập nhật.

        Returns:
            Số bản ghi đã xử lý.
        """
        for pk in sorted(ids, key=str):
            self.update(actor, pk, dict(data))
        return len(ids)

    @transaction.atomic
    def bulk_delete(self, actor: Any, ids: list[Any]) -> int:
        """Xóa cả lô; lỗi một bản ghi thì không bản ghi nào bị xóa.

        Args:
            actor: Người thực hiện.
            ids: Id bản ghi.

        Returns:
            Số bản ghi đã xử lý.
        """
        for pk in sorted(ids, key=str):
            self.delete(actor, pk)
        return len(ids)

    # ==================================================================
    # Tiện ích cho lớp con
    # ==================================================================
    def get_for_write(self, actor: Any, pk: Any) -> M:
        """Khóa dòng để ghi và kiểm owner (phải gọi trong transaction).

        Raises:
            NotFoundError: Không tồn tại, đã xóa mềm hoặc thuộc người khác.
        """
        instance = self.repository.get_for_update(pk)
        if not self.can_access(actor, instance):
            raise NotFoundError()
        return instance

    def ensure_quota(self, owner: Any) -> None:
        """Chặn khi owner đã đạt số bản ghi tối đa (`owner_quota_setting`).

        Khóa dòng user trước khi đếm để hai request đồng thời không cùng vượt.

        Raises:
            ConflictError: `QUOTA_EXCEEDED`.
        """
        if not (self.owner_field and self.owner_quota_setting):
            return
        limit = int(getattr(settings, self.owner_quota_setting))
        get_user_model()._default_manager.select_for_update().filter(pk=owner.pk).first()
        if self.repository.count(**{f"{self.owner_field}_id": owner.pk}) >= limit:
            raise ConflictError(
                "Bạn đã đạt số lượng tối đa cho phép.",
                code=ErrorCode.QUOTA_EXCEEDED,
                details={"limit": limit},
            )

    @staticmethod
    def log_event(instance: M, event: str, data: dict[str, Any] | None = None, actor: Any = None) -> None:
        """Ghi sự kiện không phải đổi field vào journal (model phải có JournalTracker).

        Args:
            instance: Bản ghi chịu tác động.
            event: Mã sự kiện, ví dụ `iam.role_assigned`.
            data: Dữ liệu kèm theo.
            actor: Người thực hiện.
        """
        if isinstance(instance, JournalTracker):
            instance.journal_event(event, data, getattr(actor, "pk", None))
