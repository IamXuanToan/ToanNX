"""API module (dữ liệu từ registry trong code, không phải queryset nên dùng APIView).

GET   /system/modules
PATCH /system/modules/{code}    body: {"enabled"?: bool, "icon"?: "shield-check", "icon_id"?: uuid|null}
"""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.admin_api_view import AdminApiView
from app.modules.system.permissions.system_permission import SystemPermission
from app.modules.system.serializers.responses.module_detail_response_serializer import (
    ModuleDetailResponseSerializer,
)
from app.modules.system.serializers.responses.module_list_response_serializer import (
    ModuleListResponseSerializer,
)
from app.modules.system.serializers.validates.module_update_validate_serializer import (
    ModuleUpdateValidateSerializer,
)
from app.modules.system.services.system_module_service import SystemModuleService


class ModuleView(AdminApiView):
    """Danh sách module đã cài."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.system_module_service = SystemModuleService()

    @extend_schema(responses=ModuleListResponseSerializer(many=True))
    @require_permission(SystemPermission.MODULE_READ)
    def get(self, request: Request) -> CoreResponse:
        """Danh sách module kèm trạng thái.

        Args:
            request: Request.

        Returns:
            Danh sách module.
        """
        states = self.system_module_service.list_modules()
        return CoreResponse(ModuleListResponseSerializer(states, many=True).data)


class ModuleObjectView(AdminApiView):
    """Bật/tắt module, đổi icon."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.system_module_service = SystemModuleService()

    @extend_schema(responses=ModuleDetailResponseSerializer)
    @require_permission(SystemPermission.MODULE_MANAGE)
    @validate_request(ModuleUpdateValidateSerializer)
    def patch(self, request: Request, code: str, validated_data: dict[str, Any]) -> CoreResponse:
        """Bật/tắt module và/hoặc đổi icon.

        Args:
            request: Request.
            code: Mã module.
            validated_data: Body đã validate.

        Returns:
            Trạng thái mới.
        """
        actor = self.get_actor(request)
        if "enabled" in validated_data:
            self.system_module_service.set_enabled(actor, code, validated_data["enabled"])
        if "icon" in validated_data or "icon_id" in validated_data:
            self.system_module_service.set_icon(actor, code, validated_data)
        return CoreResponse(ModuleDetailResponseSerializer(self.system_module_service.get_state(code)).data)
