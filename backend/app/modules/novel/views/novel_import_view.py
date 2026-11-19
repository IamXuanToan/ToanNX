"""API tải template và import tiểu thuyết từ JSON."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.novel.permissions.novel_permission import NovelPermission as P
from app.modules.novel.serializers.responses.novel_import_response_serializer import (
    NovelImportResultResponseSerializer,
    NovelImportTemplateResponseSerializer,
)
from app.modules.novel.serializers.validates.novel_import_validate_serializer import (
    NovelImportValidateSerializer,
)
from app.modules.novel.services.novel_import_service import NovelImportService


class NovelImportView(CoreApiView):
    """Tải template import (GET) và import tiểu thuyết hàng loạt (POST)."""

    def __init__(self, service: NovelImportService | None = None, **kwargs: Any) -> None:
        """Khởi tạo NovelImportView.

        Args:
            service: NovelImportService quản lý import.
            **kwargs: Các tham số bổ sung cho CoreApiView.
        """
        super().__init__(**kwargs)
        self.service = service or NovelImportService()

    @extend_schema(responses={200: NovelImportTemplateResponseSerializer})
    @require_permission(P.READ, P.IMPORT)
    def get(self, request: Request) -> CoreResponse:
        """Tải cấu trúc template mẫu JSON để import tiểu thuyết.

        Args:
            request: Đối tượng Request từ client.

        Returns:
            CoreResponse: Cấu trúc JSON mẫu gồm thông tin truyện và danh sách chương.
        """
        template = self.service.get_template()
        return CoreResponse(template)

    @extend_schema(
        request=NovelImportValidateSerializer,
        responses={201: NovelImportResultResponseSerializer},
    )
    @rate_limit("novel.import")
    @require_permission(P.IMPORT)
    @validate_request(NovelImportValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Import tiểu thuyết và toàn bộ danh sách chương trong một transaction cơ sở dữ liệu.

        Args:
            request: Đối tượng Request từ client.
            validated_data: Dữ liệu JSON đã qua validate.

        Returns:
            CoreResponse: Kết quả import với HTTP status 201 Created.
        """
        actor = self.get_actor(request)
        result = self.service.import_from_dict(actor, validated_data)
        return CoreResponse(result, status=201)
