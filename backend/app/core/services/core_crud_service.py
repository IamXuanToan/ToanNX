"""Service gốc cho CRUD: hợp đồng giữa CoreModelViewSet và tầng nghiệp vụ.

Lớp con khai báo `repository_class` và ghi đè các hook khi có quy tắc nghiệp vụ
(ví dụ UserService ghi đè `create`/`update` để chống leo thang đặc quyền).
"""

from typing import Any

from django.db import models, transaction
from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository


class CoreCrudService[M: models.Model, R: CoreRepository[Any]]:
    """CRUD mặc định ủy quyền cho repository.

    Type params:
        M: Model.
        R: Lớp repository (để service con dùng method riêng của repository mà vẫn đúng kiểu).

    Attributes:
        repository_class: Lớp repository của model.
        repository: Repository của model (luôn tên `repository`; repository/service khác đặt
            tên `<tên>_repository` / `<tên>_service`).
    """

    repository_class: type[R]

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
        """Queryset gốc cho danh sách (view áp filter/search/ordering/pagination lên đây).

        Returns:
            QuerySet.
        """
        return self.repository.get_queryset()

    def get_by_id(self, pk: Any) -> M:
        """Chi tiết bản ghi.

        Args:
            pk: Khóa chính.

        Returns:
            Bản ghi.

        Raises:
            NotFoundError: Không tồn tại.
        """
        return self.repository.get_by_id(pk)

    # ==================================================================
    # Ghi
    # ==================================================================
    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> M:
        """Tạo bản ghi.

        Args:
            actor: Người thực hiện.
            data: Dữ liệu đã validate.

        Returns:
            Bản ghi mới.
        """
        return self.repository.create(actor=actor, **data)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> M:
        """Cập nhật bản ghi (khóa dòng trước khi sửa).

        Args:
            actor: Người thực hiện.
            pk: Khóa chính.
            data: Dữ liệu đã validate (partial).

        Returns:
            Bản ghi sau cập nhật.
        """
        instance = self.repository.get_for_update(pk)
        return self.repository.update(instance, actor=actor, **data)

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa bản ghi: xóa mềm nếu model hỗ trợ, ngược lại xóa cứng.

        Args:
            actor: Người thực hiện.
            pk: Khóa chính.
        """
        instance = self.repository.get_for_update(pk)
        if hasattr(instance, "mark_deleted"):
            self.repository.soft_delete(instance, actor=actor)
        else:
            self.repository.hard_delete(instance)
