"""Cài đặt Trợ lý cá nhân (`GET/PUT/PATCH /workspace/settings` & `/workspace/settings/<owner_id>`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.services.telegram_bot_service import TelegramBotService
from app.workspace.permissions.workspace_setting_permission import WorkspaceSettingPermission
from app.workspace.serializers.responses.workspace_setting_response_serializer import (
    WorkspaceSettingResponseSerializer,
)
from app.workspace.serializers.validates.workspace_setting_update_validate_serializer import (
    WorkspaceSettingUpdateValidateSerializer,
)
from app.workspace.services.workspace_setting_service import WorkspaceSettingService


class WorkspaceSettingView(CoreApiView):
    """Đọc và cập nhật cấu hình Trợ lý/Digest/Telegram Group của chính người đang đăng nhập."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service cài đặt và Bot Telegram hệ thống."""
        super().__init__(**kwargs)
        self.setting_service = WorkspaceSettingService()
        self.telegram_bot_service = TelegramBotService()

    @extend_schema(responses=WorkspaceSettingResponseSerializer)
    @require_permission(WorkspaceSettingPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Lấy cấu hình của chính mình (tự tạo mặc định nếu chưa có)."""
        actor = self.get_actor(request)
        setting = self.setting_service.get_or_create_for_owner(actor)
        ctx = {
            "available_ai_models": self.setting_service.available_ai_models(),
            "telegram_bot_info": self.telegram_bot_service.bot_info(),
        }
        return CoreResponse(WorkspaceSettingResponseSerializer(setting, context=ctx).data)

    @extend_schema(
        request=WorkspaceSettingUpdateValidateSerializer,
        responses=WorkspaceSettingResponseSerializer,
    )
    @require_permission(WorkspaceSettingPermission.UPDATE)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    @validate_request(WorkspaceSettingUpdateValidateSerializer)
    def put(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật cấu hình của chính mình (PUT)."""
        return self._save_own(request, validated_data)

    @extend_schema(
        request=WorkspaceSettingUpdateValidateSerializer,
        responses=WorkspaceSettingResponseSerializer,
    )
    @require_permission(WorkspaceSettingPermission.UPDATE)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    @validate_request(WorkspaceSettingUpdateValidateSerializer)
    def patch(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật một phần cấu hình của chính mình (PATCH)."""
        return self._save_own(request, validated_data)

    def _save_own(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        actor = self.get_actor(request)
        updated = self.setting_service.update_for_owner(actor, actor.pk, validated_data)
        ctx = {
            "available_ai_models": self.setting_service.available_ai_models(),
            "telegram_bot_info": self.telegram_bot_service.bot_info(),
        }
        return CoreResponse(WorkspaceSettingResponseSerializer(updated, context=ctx).data)


class WorkspaceSettingObjectView(CoreApiView):
    """Đọc/sửa cấu hình của user bất kỳ (chỉ dành cho Admin có quyền `workspace_setting.manage_all`)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service cài đặt và Bot Telegram hệ thống."""
        super().__init__(**kwargs)
        self.setting_service = WorkspaceSettingService()
        self.telegram_bot_service = TelegramBotService()

    @extend_schema(
        operation_id="workspace_settings_by_owner_retrieve",
        responses=WorkspaceSettingResponseSerializer,
    )
    @require_permission(WorkspaceSettingPermission.MANAGE_ALL)
    def get(self, request: Request, owner_id: Any) -> CoreResponse:
        """Lấy cấu hình theo `owner_id` (trả 404 nếu user không tồn tại)."""
        _, setting = self.setting_service.get_for_target_owner(owner_id)
        ctx = {
            "available_ai_models": self.setting_service.available_ai_models(),
            "telegram_bot_info": self.telegram_bot_service.bot_info(),
        }
        return CoreResponse(WorkspaceSettingResponseSerializer(setting, context=ctx).data)

    @extend_schema(
        operation_id="workspace_settings_by_owner_update",
        request=WorkspaceSettingUpdateValidateSerializer,
        responses=WorkspaceSettingResponseSerializer,
    )
    @require_permission(WorkspaceSettingPermission.MANAGE_ALL)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    @validate_request(WorkspaceSettingUpdateValidateSerializer)
    def put(self, request: Request, validated_data: dict[str, Any], owner_id: Any) -> CoreResponse:
        """Cập nhật cấu hình cho `owner_id` (PUT)."""
        return self._save_target(request, owner_id, validated_data)

    @extend_schema(
        operation_id="workspace_settings_by_owner_partial_update",
        request=WorkspaceSettingUpdateValidateSerializer,
        responses=WorkspaceSettingResponseSerializer,
    )
    @require_permission(WorkspaceSettingPermission.MANAGE_ALL)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    @validate_request(WorkspaceSettingUpdateValidateSerializer)
    def patch(self, request: Request, validated_data: dict[str, Any], owner_id: Any) -> CoreResponse:
        """Cập nhật cấu hình cho `owner_id` (PATCH)."""
        return self._save_target(request, owner_id, validated_data)

    def _save_target(self, request: Request, owner_id: Any, validated_data: dict[str, Any]) -> CoreResponse:
        actor = self.get_actor(request)
        updated = self.setting_service.update_for_owner(actor, owner_id, validated_data)
        ctx = {
            "available_ai_models": self.setting_service.available_ai_models(),
            "telegram_bot_info": self.telegram_bot_service.bot_info(),
        }
        return CoreResponse(WorkspaceSettingResponseSerializer(updated, context=ctx).data)
