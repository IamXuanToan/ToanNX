"""Thêm block vào trang."""

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
from app.modules.custom_pages.serializers.validates.page_block_create_validate_serializer import (
    PageBlockCreateValidateSerializer,
)
from app.modules.custom_pages.services.page_block_service import PageBlockService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.member_api_view import MemberApiView


class PageBlockCollectionView(MemberApiView):
    """Thêm block vào cuối trang."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.page_block_service = PageBlockService()

    @extend_schema(responses=PageBlockResponseSerializer)
    @require_permission(CustomPagesPermission.UPDATE)
    @validate_request(PageBlockCreateValidateSerializer)
    def post(self, request: Request, page_id: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Tạo block của trang actor sở hữu."""
        block = self.page_block_service.add_block(self.get_actor(request), page_id, validated_data)
        return CoreResponse(PageBlockResponseSerializer(block).data, status=201)
