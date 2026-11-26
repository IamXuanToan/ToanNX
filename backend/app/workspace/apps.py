"""Cấu hình app Workspace (`CoreModuleConfig`): đăng ký module & hook Telegram hai chiều."""

from app.core.registry.core_module_config import CoreModuleConfig
from app.core.registry.module_registry import module_registry


class WorkspaceConfig(CoreModuleConfig):
    """App Workspace: Trợ lý cá nhân & AI OS trên Client Portal."""

    default = True
    name = "app.workspace"
    label = "workspace"
    verbose_name = "Workspace"

    def ready(self) -> None:
        """Nạp module vào Registry và đăng ký handler nhận tin nhắn từ Bot Telegram chung."""
        super().ready()
        from app.workspace.services.telegram_assistant_router_service import (  # noqa: PLC0415
            TelegramAssistantRouterService,
        )

        module_registry.register_telegram_update_handler(
            TelegramAssistantRouterService().handle_webhook_update
        )
