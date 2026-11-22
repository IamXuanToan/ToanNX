"""POST /finance/platforms/seed-defaults: tạo nền tảng + quy tắc mẫu cho chính mình."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.serializers.responses.platform_seed_response_serializer import PlatformSeedResponseSerializer
from app.finance.services.platform_service import PlatformService
from app.system.decorators.require_permission import require_permission


class PlatformSeedView(CoreApiView):
    """Không tạo mốc thuế; bỏ qua mã đã có."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.platform_service = PlatformService()

    @extend_schema(request=None, responses=PlatformSeedResponseSerializer)
    @require_permission(PlatformPermission.CREATE)
    def post(self, request: Request) -> CoreResponse:
        """Số nền tảng mới tạo."""
        created = self.platform_service.seed_defaults(self.get_actor(request))
        return CoreResponse(PlatformSeedResponseSerializer({"created": created}).data)
