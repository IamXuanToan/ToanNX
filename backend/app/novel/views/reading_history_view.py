"""API quản lý lịch sử đọc truyện của người dùng."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.novel.serializers.responses.reading_history_clear_response_serializer import (
    ReadingHistoryClearResponseSerializer,
)
from app.novel.serializers.responses.reading_history_response_serializer import (
    ReadingHistoryResponseSerializer,
)
from app.novel.serializers.validates.reading_history_record_validate_serializer import (
    ReadingHistoryRecordValidateSerializer,
)
from app.novel.services.reading_history_service import ReadingHistoryService


class ReadingHistoryView(CoreApiView):
    """Danh sách và ghi nhận lịch sử đọc của người dùng hiện tại."""

    permission_classes = [IsActiveAuthenticated]

    def __init__(self, service: ReadingHistoryService | None = None, **kwargs: Any) -> None:
        """Khởi tạo ReadingHistoryView với ReadingHistoryService.

        Args:
            service: ReadingHistoryService quản lý lịch sử đọc.
            **kwargs: Các tham số bổ sung cho CoreApiView.
        """
        super().__init__(**kwargs)
        self.service = service or ReadingHistoryService()

    @extend_schema(responses={200: ReadingHistoryResponseSerializer(many=True)})
    def get(self, request: Request) -> CoreResponse:
        """Lấy danh sách lịch sử đọc của người dùng hiện tại.

        Args:
            request: Đối tượng Request từ client.

        Returns:
            CoreResponse: Danh sách lịch sử đọc truyện đã serialize.
        """
        actor = self.get_actor(request)
        queryset = self.service.list_for_user(actor.pk)
        data = ReadingHistoryResponseSerializer(queryset, many=True, context={"request": request}).data
        return CoreResponse(data)

    @extend_schema(
        request=ReadingHistoryRecordValidateSerializer,
        responses={200: ReadingHistoryResponseSerializer},
    )
    @validate_request(ReadingHistoryRecordValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Ghi nhận người dùng đã đọc một chương truyện.

        Args:
            request: Đối tượng Request từ client.
            validated_data: Dữ liệu đã validate chứa `novel_id` và `chapter_id`.

        Returns:
            CoreResponse: Bản ghi lịch sử đọc vừa được ghi nhận.
        """
        actor = self.get_actor(request)
        history = self.service.record_read(actor, validated_data["novel_id"], validated_data["chapter_id"])
        return CoreResponse(ReadingHistoryResponseSerializer(history, context={"request": request}).data)

    @extend_schema(
        operation_id="novel_reading_history_clear",
        responses={200: ReadingHistoryClearResponseSerializer},
    )
    def delete(self, request: Request) -> CoreResponse:
        """Xóa toàn bộ lịch sử đọc của người dùng hiện tại.

        Args:
            request: Đối tượng Request từ client.

        Returns:
            CoreResponse: Số lượng bản ghi lịch sử đọc đã bị xóa.
        """
        actor = self.get_actor(request)
        count = self.service.clear_all(actor)
        return CoreResponse({"deleted_count": count})
