"""API quản lý truyện yêu thích của người dùng."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.core.views.core_api_view import CoreApiView
from app.modules.novel.serializers.responses.favorite_response_serializer import (
    FavoriteResponseSerializer,
)
from app.modules.novel.services.favorite_service import FavoriteService


class FavoriteToggleValidateSerializer(CoreValidateSerializer):
    """Input bật/tắt yêu thích truyện."""

    novel_id = serializers.UUIDField(help_text="Mã truyện (UUID).")


class FavoriteToggleResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả bật/tắt yêu thích."""

    is_favorite = serializers.BooleanField(help_text="Trạng thái yêu thích mới.")
    favorites_count = serializers.IntegerField(help_text="Tổng lượt thích của truyện sau khi cập nhật.")


class FavoriteView(CoreApiView):
    """Danh sách và bật/tắt truyện yêu thích của người dùng hiện tại."""

    permission_classes = [IsActiveAuthenticated]

    def __init__(self, service: FavoriteService | None = None, **kwargs: Any) -> None:
        """Khởi tạo FavoriteView với FavoriteService.

        Args:
            service: FavoriteService quản lý yêu thích.
            **kwargs: Các tham số bổ sung cho CoreApiView.
        """
        super().__init__(**kwargs)
        self.service = service or FavoriteService()

    @extend_schema(responses={200: FavoriteResponseSerializer(many=True)})
    def get(self, request: Request) -> CoreResponse:
        """Lấy danh sách các truyện yêu thích của người dùng hiện tại.

        Args:
            request: Đối tượng Request từ client.

        Returns:
            CoreResponse: Danh sách các bản ghi truyện yêu thích đã serialize.
        """
        actor = self.get_actor(request)
        queryset = self.service.list_for_user(actor.pk)
        data = FavoriteResponseSerializer(queryset, many=True, context={"request": request}).data
        return CoreResponse(data)

    @extend_schema(
        request=FavoriteToggleValidateSerializer,
        responses={200: FavoriteToggleResponseSerializer},
    )
    @validate_request(FavoriteToggleValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Bật hoặc tắt trạng thái yêu thích cho một bộ truyện.

        Args:
            request: Đối tượng Request từ client.
            validated_data: Dữ liệu đã validate chứa `novel_id`.

        Returns:
            CoreResponse: Kết quả trạng thái yêu thích mới và tổng lượt thích.
        """
        actor = self.get_actor(request)
        is_favorite, favorites_count = self.service.toggle(actor, validated_data["novel_id"])
        return CoreResponse({"is_favorite": is_favorite, "favorites_count": favorites_count})
