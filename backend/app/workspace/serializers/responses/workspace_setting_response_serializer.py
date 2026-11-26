"""Response Cài đặt Trợ lý cá nhân, Lịch Digest & Chính sách Telegram Group."""

from typing import Any

from django.conf import settings
from rest_framework import serializers

from app.workspace.constants.workspace_defaults import DEFAULT_DIGEST_SECTIONS
from app.workspace.models.workspace_setting import WorkspaceSetting


class WorkspaceSettingResponseSerializer(serializers.ModelSerializer[WorkspaceSetting]):
    """Cấu hình cá nhân kèm danh sách model AI khả dụng và thông tin Bot Telegram chung."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    available_ai_models = serializers.SerializerMethodField(
        help_text="Danh sách model AI khả dụng do hệ thống cấu hình."
    )
    available_digest_sections = serializers.SerializerMethodField(
        help_text="Các mục dữ liệu hỗ trợ hiển thị trong Digest."
    )
    telegram_bot_configured = serializers.SerializerMethodField(
        help_text="Bot Telegram hệ thống đã cấu hình token hay chưa."
    )
    telegram_bot_username = serializers.SerializerMethodField(
        help_text="Username bot Telegram hệ thống (không kèm @)."
    )
    telegram_bot_url = serializers.SerializerMethodField(
        help_text="Liên kết mở Bot Telegram trên trình duyệt."
    )

    class Meta:
        model = WorkspaceSetting
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "timezone",
            "daily_digest_enabled",
            "digest_time_slots",
            "digest_sections",
            "warranty_alert_days",
            "subscription_default_alert_days",
            "preferred_ai_model",
            "ai_daily_token_limit",
            "telegram_ai_enabled",
            "telegram_owner_user_id",
            "telegram_allowed_chat_ids",
            "telegram_group_require_mention",
            "telegram_group_tool_policy",
            "telegram_group_hide_amounts",
            "telegram_group_reply_in_dm",
            "available_ai_models",
            "available_digest_sections",
            "telegram_bot_configured",
            "telegram_bot_username",
            "telegram_bot_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_available_ai_models(self, obj: WorkspaceSetting) -> list[str]:
        """Lấy từ context hoặc cấu hình `XKIRO_MODEL` / `XKIRO_FALLBACK_MODELS`."""
        from_ctx = self.context.get("available_ai_models")
        if isinstance(from_ctx, list):
            return [str(m) for m in from_ctx]
        candidates = [settings.XKIRO_MODEL, *settings.XKIRO_FALLBACK_MODELS]
        seen: list[str] = []
        for item in candidates:
            cleaned = str(item or "").strip()
            if cleaned and cleaned not in seen:
                seen.append(cleaned)
        return seen

    def get_available_digest_sections(self, obj: WorkspaceSetting) -> list[str]:
        """Danh sách mục Digest được hệ thống hỗ trợ."""
        return list(DEFAULT_DIGEST_SECTIONS)

    def _bot_info(self) -> dict[str, Any]:
        info = self.context.get("telegram_bot_info")
        return info if isinstance(info, dict) else {}

    def get_telegram_bot_configured(self, obj: WorkspaceSetting) -> bool:
        """Bot Telegram hệ thống đã cấu hình token hay chưa."""
        info = self._bot_info()
        if "configured" in info:
            return bool(info["configured"])
        return bool(settings.TELEGRAM_BOT_TOKEN)

    def get_telegram_bot_username(self, obj: WorkspaceSetting) -> str:
        """Username Bot Telegram hệ thống."""
        return str(self._bot_info().get("username") or settings.TELEGRAM_BOT_USERNAME or "")

    def get_telegram_bot_url(self, obj: WorkspaceSetting) -> str:
        """Link t.me mở Bot Telegram hệ thống."""
        url = str(self._bot_info().get("bot_url") or "")
        if url:
            return url
        username = self.get_telegram_bot_username(obj)
        return f"https://t.me/{username}" if username else ""
