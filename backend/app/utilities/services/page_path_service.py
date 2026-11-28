"""Nghiệp vụ đường dẫn giữa (tài nguyên chung, chỉ theo quyền IAM)."""

from typing import Any

from django.conf import settings
from django.db import transaction

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.conflict_error import ConflictError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.slug import normalize_slug
from app.utilities.constants.public_cache import PUBLIC_CACHE_NAMESPACE
from app.utilities.constants.utilities_error_code import UtilitiesErrorCode
from app.utilities.models.page_path import PagePath
from app.utilities.repositories.page_path_repository import PagePathRepository

SEGMENT_MIN_LENGTH = 1
SEGMENT_MAX_LENGTH = 32


def normalize_segment(value: str) -> str:
    """Segment: luật ký tự như slug, 1–32 ký tự, không trùng đoạn dành riêng của site.

    Args:
        value: Giá trị thô.

    Returns:
        Segment đã chuẩn hóa.
    """
    return normalize_slug(
        value,
        field="segment",
        min_length=SEGMENT_MIN_LENGTH,
        max_length=SEGMENT_MAX_LENGTH,
        reserved=settings.PUBLIC_RESERVED_SEGMENTS,
    )


class PagePathService(CoreCrudService[PagePath, PagePathRepository]):
    """Ai có quyền thì tạo; còn trang thì không xóa được; đổi segment làm URL cũ 404."""

    repository_class = PagePathRepository
    public_cache_namespace = PUBLIC_CACHE_NAMESPACE

    def find_by_segment(self, segment: str) -> PagePath | None:
        """Đường dẫn giữa theo segment đã chuẩn hóa; segment sai định dạng → `ValidationError`."""
        return self.repository.find_by_segment(normalize_segment(segment))

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> PagePath:
        """Tạo đường dẫn giữa.

        Raises:
            ConflictError: Segment đã có (kể cả đã xóa).
        """
        fields = {**data, "segment": normalize_segment(data["segment"])}
        return self._save(lambda: super(PagePathService, self).create(actor, fields))

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> PagePath:
        """Sửa đường dẫn giữa."""
        fields = dict(data)
        if "segment" in fields:
            fields["segment"] = normalize_segment(fields["segment"])
        return self._save(lambda: super(PagePathService, self).update(actor, pk, fields))

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm khi không còn trang nào.

        Raises:
            ConflictError: `UTILITIES_PAGE_PATH_IN_USE`.
        """
        path = self.get_for_write(actor, pk)
        if self.repository.has_pages(path.pk):
            raise ConflictError(
                "Đường dẫn giữa còn trang, không xóa được.",
                code=UtilitiesErrorCode.PAGE_PATH_IN_USE,
            )
        self.repository.delete(path, actor=actor)
        self.invalidate_public_cache()

    @staticmethod
    def _save(operation: Any) -> PagePath:
        """Đổi lỗi unique của DB thành lỗi theo field."""
        try:
            result: PagePath = operation()
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError(
                "Segment đã được sử dụng.", details={"segment": ["Segment đã tồn tại."]}
            ) from exc
        return result
