"""Response Cài đặt Lịch Digest & Mốc nhắc cá nhân (không gồm cấu hình AI Bot của Admin)."""

from typing import Any

from django.conf import settings
from rest_framework import serializers

from app.workspace.constants.workspace_defaults import DEFAULT_DIGEST_SECTIONS
from app.workspace.models.workspace_setting import WorkspaceSetting


class WorkspaceSettingResponseSerializer(serializers.ModelSerializer[WorkspaceSetting]):
    """Cấu hình cá nhân: múi giờ, digest, mốc nhắc mặc định và chat Telegram đã liên kết."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    owner_name = serializers.CharField(
        source="owner.full_name", read_only=True, default="", help_text="Tên chủ sở hữu."
    )
    owner_username = serializers.CharField(
        source="owner.username",
        read_only=True,
        allow_null=True,
        default="",
        help_text="Tên đăng nhập chủ sở hữu.",
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
            "owner_name",
            "owner_username",
            "timezone",
            "daily_digest_enabled",
            "digest_time_slots",
            "digest_sections",
            "warranty_alert_days",
            "subscription_default_alert_days",
            "telegram_owner_user_id",
            "telegram_allowed_chat_ids",
            "available_digest_sections",
            "telegram_bot_configured",
            "telegram_bot_username",
            "telegram_bot_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

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
        """URL mở Bot Telegram hệ thống."""
        info = self._bot_info()
        if "url" in info:
            return str(info["url"] or "")
        username = self.get_telegram_bot_username(obj)
        return f"https://t.me/{username}" if username else ""
