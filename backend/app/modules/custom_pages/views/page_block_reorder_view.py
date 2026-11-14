"""Sắp xếp block của trang."""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission
from app.modules.custom_pages.serializers.responses.page_block_response_serializer import (
    PageBlockResponseSerializer,
)
from app.modules.custom_pages.serializers.validates.page_block_reorder_validate_serializer import (
    PageBlockReorderValidateSerializer,
)
from app.modules.custom_pages.services.page_block_service import PageBlockService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.member_api_view import MemberApiView


class PageBlockReorderView(MemberApiView):
    """Thay thứ tự toàn bộ block trong một transaction."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.page_block_service = PageBlockService()

    @extend_schema(responses=PageBlockResponseSerializer(many=True))
    @require_permission(CustomPagesPermission.UPDATE)
    @validate_request(PageBlockReorderValidateSerializer)
    def post(self, request: Request, page_id: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Sắp xếp theo danh sách id đã xác minh."""
        blocks = self.page_block_service.reorder(
            self.get_actor(request), page_id, validated_data["block_ids"]
        )
        return CoreResponse(PageBlockResponseSerializer(blocks, many=True).data)
