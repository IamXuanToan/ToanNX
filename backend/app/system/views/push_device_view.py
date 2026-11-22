"""GET/POST /system/notifications/devices · DELETE /system/notifications/devices/{token}."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.push_device_permission import PushDevicePermission
from app.system.serializers.responses.push_device_response_serializer import PushDeviceResponseSerializer
from app.system.serializers.validates.push_device_validate_serializer import PushDeviceValidateSerializer
from app.system.services.push_device_service import PushDeviceService


class PushDeviceView(CoreApiView):
    """Trình duyệt của mình đã bật thông báo; đăng ký/gia hạn token."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.push_device_service = PushDeviceService()

    @extend_schema(responses=PushDeviceResponseSerializer(many=True))
    @require_permission(PushDevicePermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Thiết bị đang dùng."""
        devices = self.push_device_service.list_for(self.get_actor(request))
        return CoreResponse(PushDeviceResponseSerializer(devices, many=True).data)

    @extend_schema(request=PushDeviceValidateSerializer, responses=PushDeviceResponseSerializer)
    @require_permission(PushDevicePermission.CREATE)
    @validate_request(PushDeviceValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Upsert theo token."""
        device = self.push_device_service.register(
            self.get_actor(request),
            validated_data["fcm_token"],
            validated_data["device_label"],
            request.headers.get("User-Agent", ""),
        )
        return CoreResponse(PushDeviceResponseSerializer(device).data, status=201)


class PushDeviceObjectView(CoreApiView):
    """Gỡ một token của mình (đăng xuất, tắt thông báo)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.push_device_service = PushDeviceService()

    @extend_schema(responses={204: None})
    @require_permission(PushDevicePermission.DELETE)
    def delete(self, request: Request, token: str) -> CoreResponse:
        """Xóa cứng thiết bị."""
        self.push_device_service.unregister(self.get_actor(request), token)
        return CoreResponse(None, status=204)
