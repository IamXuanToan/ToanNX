"""Repository truy vấn PageFeedback."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackRepository(CoreRepository[PageFeedback]):
    """Truy vấn góp ý/báo lỗi kèm select_related tránh N+1."""

    model = PageFeedback

    def get_queryset(self) -> QuerySet[PageFeedback]:
        """Nạp sẵn owner, page và short_link cho danh sách & chi tiết."""
        return (
            super()
            .get_queryset()
            .select_related("target_owner", "page", "short_link", "resolved_by", "thanked_by")
        )
