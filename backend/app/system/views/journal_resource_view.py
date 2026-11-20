"""API danh mục tài nguyên có ghi lịch sử: GET /journal/resources."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.journal_entry_permission import JournalEntryPermission
from app.system.serializers.responses.journal_resource_response_serializer import (
    JournalResourceResponseSerializer,
)
from app.system.services.journal_entry_service import JournalEntryService


class JournalResourceView(CoreApiView):
    """Các `module.model` đang ghi lịch sử, dùng làm lựa chọn của bộ lọc."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.journal_entry_service = JournalEntryService()

    @extend_schema(responses=JournalResourceResponseSerializer(many=True))
    @require_permission(JournalEntryPermission.ENTRY_READ)
    def get(self, request: Request) -> CoreResponse:
        """Danh mục tài nguyên.

        Args:
            request: Request.

        Returns:
            Danh sách tài nguyên.
        """
        resources = self.journal_entry_service.list_resources()
        return CoreResponse(JournalResourceResponseSerializer(resources, many=True).data)
