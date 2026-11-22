"""API xóa một mục lịch sử đọc."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.exceptions.not_found_error import NotFoundError
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.novel.serializers.responses.reading_history_delete_response_serializer import (
    ReadingHistoryDeleteResponseSerializer,
)
from app.novel.services.reading_history_service import ReadingHistoryService


class ReadingHistoryObjectView(CoreApiView):
    """Thao tác trên một mục lịch sử đọc cụ thể."""

    permission_classes = [IsActiveAuthenticated]

    def __init__(self, service: ReadingHistoryService | None = None, **kwargs: Any) -> None:
        """Khởi tạo ReadingHistoryObjectView.

        Args:
            service: ReadingHistoryService quản lý lịch sử đọc.
            **kwargs: Các tham số bổ sung cho CoreApiView.
        """
        super().__init__(**kwargs)
        self.service = service or ReadingHistoryService()

    @extend_schema(
        operation_id="novel_reading_history_delete",
        responses={200: ReadingHistoryDeleteResponseSerializer},
    )
    def delete(self, request: Request, pk: str) -> CoreResponse:
        """Xóa một mục khỏi lịch sử đọc của người dùng.

        Args:
            request: Đối tượng Request từ client.
            pk: ID của bản ghi lịch sử đọc cần xóa.

        Returns:
            CoreResponse: Kết quả xóa thành công `{"deleted": True}`.

        Raises:
            NotFoundError: Nếu bản ghi không tồn tại hoặc không thuộc quyền sở hữu của user.
        """
        actor = self.get_actor(request)
        deleted = self.service.delete_item(actor, pk)
        if not deleted:
            raise NotFoundError("Mục lịch sử không tồn tại.")
        return CoreResponse({"deleted": True})
