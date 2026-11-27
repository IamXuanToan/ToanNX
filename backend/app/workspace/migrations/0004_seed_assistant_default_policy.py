"""Data migration: khởi tạo sẵn Policy an toàn mặc định cho Chatbot AI (nếu chưa tùy biến)."""

from typing import Any

from django.db import migrations

from app.workspace.constants.workspace_defaults import DEFAULT_ASSISTANT_SYSTEM_PROMPT

CONFIG_KEY = "workspace_assistant_config"


def seed_default_assistant_policy(apps: Any, schema_editor: Any) -> None:
    """Seed sẵn `assistant_system_prompt` an toàn mặc định vào `system.Setting`."""
    setting_model = apps.get_model("system", "Setting")
    obj = setting_model.objects.filter(key=CONFIG_KEY, deleted_at__isnull=True).first()
    if obj is None:
        setting_model.objects.create(
            key=CONFIG_KEY,
            value={
                "assistant_name": "",
                "assistant_avatar_id": None,
                "assistant_system_prompt": DEFAULT_ASSISTANT_SYSTEM_PROMPT,
                "preferred_ai_model": "",
                "ai_daily_token_limit": None,
                "telegram_ai_enabled": True,
                "telegram_group_require_mention": True,
                "telegram_group_tool_policy": "OWNER_ONLY",
                "telegram_group_hide_amounts": False,
                "telegram_group_reply_in_dm": False,
            },
            description="Cấu hình Chatbot AI toàn hệ thống (Avatar, Policy, Model, Token, Telegram).",
            category="assistant",
            is_public=False,
        )
        return

    current = dict(obj.value) if isinstance(obj.value, dict) else {}
    if not str(current.get("assistant_system_prompt") or "").strip():
        current["assistant_system_prompt"] = DEFAULT_ASSISTANT_SYSTEM_PROMPT
        obj.value = current
        obj.save(update_fields=["value", "updated_at"])


def unseed_default_assistant_policy(apps: Any, schema_editor: Any) -> None:
    """Rollback: chỉ gỡ Policy mặc định nếu quản trị viên chưa sửa nội dung."""
    setting_model = apps.get_model("system", "Setting")
    obj = setting_model.objects.filter(key=CONFIG_KEY, deleted_at__isnull=True).first()
    if obj is None or not isinstance(obj.value, dict):
        return
    if str(obj.value.get("assistant_system_prompt") or "").strip() == DEFAULT_ASSISTANT_SYSTEM_PROMPT:
        updated = dict(obj.value)
        updated["assistant_system_prompt"] = ""
        obj.value = updated
        obj.save(update_fields=["value", "updated_at"])


class Migration(migrations.Migration):
    """Khởi tạo sẵn Policy an toàn mặc định cho Trợ lý AI."""

    dependencies = [
        ("workspace", "0003_remove_uptime_and_add_notification_channels"),
        ("system", "0011_remove_telegrambot_created_by_and_more"),
    ]

    operations = [migrations.RunPython(seed_default_assistant_policy, unseed_default_assistant_policy)]
