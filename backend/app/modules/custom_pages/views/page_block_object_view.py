"""Sửa và xóa một block của trang."""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission
from app.modules.custom_pages.serializers.responses.page_block_response_serializer import (
    PageBlockResponseSerializer,
)
from app.modules.custom_pages.serializers.validates.page_block_update_validate_serializer import (
    PageBlockUpdateValidateSerializer,
)
from app.modules.custom_pages.services.page_block_service import PageBlockService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.member_api_view import MemberApiView


class PageBlockObjectView(MemberApiView):
    """Cập nhật hoặc xóa block."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.page_block_service = PageBlockService()

    @extend_schema(responses=PageBlockResponseSerializer)
    @require_permission(CustomPagesPermission.UPDATE)
    @validate_request(PageBlockUpdateValidateSerializer)
    def patch(
        self, request: Request, page_id: UUID, block_id: UUID, validated_data: dict[str, Any]
    ) -> CoreResponse:
        """Sửa block sau khi kiểm tra page và owner."""
        block = self.page_block_service.update_block(
            self.get_actor(request), page_id, block_id, validated_data
        )
        return CoreResponse(PageBlockResponseSerializer(block).data)

    @extend_schema(responses={204: None})
    @require_permission(CustomPagesPermission.UPDATE)
    def delete(self, request: Request, page_id: UUID, block_id: UUID) -> Response:
        """Xóa mềm block và dồn vị trí."""
        self.page_block_service.delete_block(self.get_actor(request), page_id, block_id)
        return Response(status=204)
