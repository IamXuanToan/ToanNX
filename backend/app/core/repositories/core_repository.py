"""Repository gốc: lớp truy cập dữ liệu DUY NHẤT (đọc + ghi) giữa service và ORM.

Luồng: url → view → service → repository → ORM.

- Đọc: queryset gốc (lớp con ghi đè để lọc soft delete, select_related, annotate), lấy theo id có
  `NotFoundError` chuẩn, các hàm tiện ích tìm/đếm. Lọc, tìm kiếm, sắp xếp, phân trang từ client
  do filter backend + pagination chuẩn của DRF xử lý trên queryset này.
- Ghi: gán audit (`created_by`, `updated_by`, `deleted_by`) nhất quán; đổi `IntegrityError` thành
  `ConflictError` trong savepoint (không làm hỏng transaction bao ngoài).

Repository KHÔNG chứa business logic.
"""

from collections.abc import Iterable
from typing import Any, cast

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, models, transaction
from django.db.models import Q, QuerySet
from django.utils import timezone

from app.core.context.user_context import get_current_user
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.tracking.journal_tracker import JournalTracker

_LOOKUP_ERRORS = (ObjectDoesNotExist, DjangoValidationError, ValueError)
_FIELD_NAMES: dict[type, frozenset[str]] = {}


class CoreRepository[M: models.Model]:
    """Repository generic.

    Attributes:
        model: Lớp model được quản lý.
    """

    model: type[M]

    # ==================================================================
    # Đọc
    # ==================================================================
    def get_queryset(self) -> QuerySet[M]:
        """Queryset gốc; lớp con ghi đè để lọc soft delete, select_related, annotate.

        Returns:
            QuerySet gốc.
        """
        return self.model._default_manager.all()

    def get_all(self, *ordering: str) -> QuerySet[M]:
        """Tất cả bản ghi của queryset gốc.

        Args:
            *ordering: Field sắp xếp (tùy chọn).

        Returns:
            QuerySet.
        """
        queryset = self.get_queryset()
        return queryset.order_by(*ordering) if ordering else queryset

    def filter(self, *conditions: Q, **filters: Any) -> QuerySet[M]:
        """Lọc theo điều kiện Q và/hoặc keyword.

        Args:
            *conditions: Điều kiện Q.
            **filters: Điều kiện keyword.

        Returns:
            QuerySet đã lọc.
        """
        return self.get_queryset().filter(*conditions, **filters)

    def exclude(self, **filters: Any) -> QuerySet[M]:
        """Loại trừ theo điều kiện.

        Args:
            **filters: Điều kiện keyword.

        Returns:
            QuerySet.
        """
        return self.get_queryset().exclude(**filters)

    def get_by_id(self, pk: Any) -> M:
        """Lấy theo id.

        Args:
            pk: Khóa chính.

        Returns:
            Bản ghi.

        Raises:
            NotFoundError: Không tồn tại hoặc id sai định dạng.
        """
        try:
            return self.get_queryset().get(pk=pk)
        except _LOOKUP_ERRORS as exc:
            raise NotFoundError() from exc

    def find_by_id(self, pk: Any) -> M | None:
        """Lấy theo id, không có thì None.

        Args:
            pk: Khóa chính.

        Returns:
            Bản ghi hoặc None.
        """
        try:
            return self.get_queryset().filter(pk=pk).first()
        except _LOOKUP_ERRORS:
            return None

    def find_one(self, **filters: Any) -> M | None:
        """Bản ghi đầu tiên khớp điều kiện.

        Args:
            **filters: Điều kiện.

        Returns:
            Bản ghi hoặc None.
        """
        return self.get_queryset().filter(**filters).first()

    def exists(self, **filters: Any) -> bool:
        """Có bản ghi khớp điều kiện hay không.

        Args:
            **filters: Điều kiện.

        Returns:
            True nếu tồn tại.
        """
        return self.get_queryset().filter(**filters).exists()

    def count(self, **filters: Any) -> int:
        """Đếm bản ghi khớp điều kiện.

        Args:
            **filters: Điều kiện.

        Returns:
            Số bản ghi.
        """
        return self.get_queryset().filter(**filters).count()

    def values_list(self, field: str, **filters: Any) -> list[Any]:
        """Danh sách giá trị của một field.

        Args:
            field: Tên field.
            **filters: Điều kiện.

        Returns:
            Danh sách giá trị.
        """
        return list(self.get_queryset().filter(**filters).values_list(field, flat=True))

    def get_for_update(self, pk: Any, *, include_deleted: bool = False) -> M:
        """Lấy và khóa dòng (SELECT ... FOR UPDATE OF <bảng>). Phải gọi trong transaction.

        Bản ghi đã xóa mềm coi như không tồn tại, trừ khi `include_deleted=True`.

        Args:
            pk: Khóa chính.
            include_deleted: Lấy cả bản ghi đã xóa mềm.

        Returns:
            Bản ghi đã khóa.

        Raises:
            NotFoundError: Không tồn tại hoặc đã xóa mềm.
        """
        queryset = self.model._default_manager.select_for_update(of=("self",))
        if not include_deleted and self.has_soft_delete():
            queryset = queryset.filter(deleted_at__isnull=True)
        try:
            return queryset.get(pk=pk)
        except _LOOKUP_ERRORS as exc:
            raise NotFoundError() from exc

    # ==================================================================
    # Ghi
    # ==================================================================
    def create(self, *, actor: Any | None = None, **fields: Any) -> M:
        """Tạo bản ghi kèm audit.

        Args:
            actor: Người thực hiện; mặc định lấy từ context.
            **fields: Giá trị field.

        Returns:
            Bản ghi đã lưu.

        Raises:
            ConflictError: Vi phạm ràng buộc.
        """
        instance = self.model(**fields)
        self.apply_audit(instance, actor, created=True)
        self.save(instance)
        return instance

    def update(self, instance: M, *, actor: Any | None = None, **fields: Any) -> M:
        """Cập nhật các field thực sự thay đổi, kèm audit.

        Args:
            instance: Bản ghi.
            actor: Người thực hiện.
            **fields: Field và giá trị mới.

        Returns:
            Bản ghi đã cập nhật.
        """
        changed = [name for name, value in fields.items() if getattr(instance, name) != value]
        if not changed:
            return instance

        for name in changed:
            setattr(instance, name, fields[name])
        audit_fields = self.apply_audit(instance, actor, created=False)
        self.save(instance, update_fields=[*changed, *audit_fields])
        return instance

    def soft_delete(self, instance: M, *, actor: Any | None = None) -> M:
        """Xóa mềm (model phải kế thừa CoreModel).

        Args:
            instance: Bản ghi.
            actor: Người thực hiện.

        Returns:
            Bản ghi đã đánh dấu xóa.
        """
        resolved = self.resolve_actor(actor)
        instance.mark_deleted(resolved)  # type: ignore[attr-defined]  # chỉ gọi với CoreModel
        audit_fields = self.apply_audit(instance, resolved, created=False)
        self.save(instance, update_fields=["deleted_at", "deleted_by", *audit_fields])
        return instance

    def hard_delete(self, instance: M) -> None:
        """Xóa cứng.

        Args:
            instance: Bản ghi.
        """
        instance.delete()

    def delete_where(self, **filters: Any) -> int:
        """Xóa cứng các bản ghi khớp điều kiện.

        Args:
            **filters: Điều kiện.

        Returns:
            Số bản ghi đã xóa (của model này).
        """
        deleted, _ = self.model._default_manager.filter(**filters).delete()
        return deleted

    def update_where(self, values: dict[str, Any], *, actor: Any | None = None, **filters: Any) -> int:
        """Cập nhật hàng loạt (`QuerySet.update`), tự gán `updated_by` nếu model có audit.

        Args:
            values: Giá trị mới.
            actor: Người thực hiện.
            **filters: Điều kiện.

        Returns:
            Số bản ghi đã cập nhật.
        """
        payload = dict(values)
        if self.has_audit():
            payload.setdefault("updated_by", self.resolve_actor(actor))
        if self.has_field("updated_at"):
            payload.setdefault("updated_at", timezone.now())
        if self._tracks(payload):
            # Model có JournalTracker: lưu từng bản ghi để lịch sử nhận đủ giá trị cũ/mới.
            instances = list(self.model._default_manager.select_for_update(of=("self",)).filter(**filters))
            for instance in instances:
                for name, value in payload.items():
                    setattr(instance, name, value)
                self.save(instance, update_fields=list(payload))
            return len(instances)
        return self.model._default_manager.filter(**filters).update(**payload)

    def bulk_create(self, instances: Iterable[M], *, actor: Any | None = None) -> list[M]:
        """Tạo hàng loạt kèm audit (`bulk_create` không gọi `save()`).

        Args:
            instances: Bản ghi chưa lưu.
            actor: Người thực hiện.

        Returns:
            Bản ghi đã tạo.
        """
        items = list(instances)
        for item in items:
            self.apply_audit(item, actor, created=True)
        try:
            with transaction.atomic():
                created = cast(list[M], self.model._default_manager.bulk_create(items))
                for item in created:
                    if isinstance(item, JournalTracker):
                        item.journal_record_created()  # bulk_create không gọi save()
                return created
        except IntegrityError as exc:
            raise ConflictError() from exc

    def save(self, instance: M, update_fields: list[str] | None = None) -> None:
        """Lưu trong savepoint; lỗi toàn vẹn thành ConflictError.

        Args:
            instance: Bản ghi.
            update_fields: Chỉ ghi các field này.

        Raises:
            ConflictError: Vi phạm ràng buộc.
        """
        try:
            with transaction.atomic():
                instance.save(update_fields=update_fields)
        except IntegrityError as exc:
            raise ConflictError() from exc

    # ==================================================================
    # Audit
    # ==================================================================
    def has_field(self, name: str) -> bool:
        """Model có field `name` hay không (cache theo lớp model).

        Args:
            name: Tên field.

        Returns:
            True nếu có.
        """
        names = _FIELD_NAMES.get(self.model)
        if names is None:
            names = frozenset(field.name for field in self.model._meta.get_fields())
            _FIELD_NAMES[self.model] = names
        return name in names

    def has_audit(self) -> bool:
        """Model có field audit của CoreModel hay không.

        Returns:
            True nếu có `created_by` và `updated_by`.
        """
        return self.has_field("created_by") and self.has_field("updated_by")

    def has_soft_delete(self) -> bool:
        """Model hỗ trợ xóa mềm hay không.

        Returns:
            True nếu có `deleted_at`.
        """
        return self.has_field("deleted_at")

    def _tracks(self, values: dict[str, Any]) -> bool:
        """Lần cập nhật hàng loạt có chạm field mà JournalTracker theo dõi không."""
        if not (isinstance(self.model, type) and issubclass(self.model, JournalTracker)):
            return False
        tracked = {field.name for field in self.model.journal_tracked_fields()}
        tracked |= {field.attname for field in self.model.journal_tracked_fields()}
        return bool(tracked & set(values)) or "deleted_at" in values

    @staticmethod
    def resolve_actor(actor: Any | None) -> Any | None:
        """Người thực hiện: tường minh trước, sau đó tới context.

        Args:
            actor: Người thực hiện truyền vào.

        Returns:
            Người thực hiện hoặc None.
        """
        return actor if actor is not None else get_current_user()

    def apply_audit(self, instance: M, actor: Any | None, *, created: bool) -> list[str]:
        """Gán audit nếu model có.

        Args:
            instance: Bản ghi.
            actor: Người thực hiện.
            created: True khi tạo mới (gán cả `created_by`).

        Returns:
            Các field audit đã đổi (để đưa vào update_fields).
        """
        if not self.has_audit():
            return []
        resolved = self.resolve_actor(actor)
        if created:
            instance.created_by = resolved  # type: ignore[attr-defined]  # đã kiểm tra has_audit
        instance.updated_by = resolved  # type: ignore[attr-defined]  # đã kiểm tra has_audit
        return ["updated_at", "updated_by"]
