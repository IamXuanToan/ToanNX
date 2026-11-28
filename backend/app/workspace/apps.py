"""Cấu hình app Workspace (`CoreModuleConfig`): đăng ký module, hook Telegram hai chiều, đồng bộ tri thức."""

from typing import Any

from django.apps import AppConfig
from django.db import DEFAULT_DB_ALIAS
from django.db.models.signals import post_migrate

from app.core.registry.core_module_config import CoreModuleConfig
from app.core.registry.module_registry import module_registry


def _sync_knowledge_after_migrate(sender: AppConfig, using: str = DEFAULT_DB_ALIAS, **kwargs: Any) -> None:
    """Sau mỗi `migrate` (local, môi trường mới, deploy) nạp lại tri thức RAG của Trợ lý từ nguồn."""
    from app.workspace.services.assistant_knowledge_service import (  # noqa: PLC0415
        AssistantKnowledgeService,
    )

    AssistantKnowledgeService().sync_after_migrate(using=using)


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
        # Tri thức RAG luôn khớp code sau migrate (không cần nhớ chạy `sync_assistant_knowledge`).
        post_migrate.connect(_sync_knowledge_after_migrate, sender=self)
