"""Nghiệp vụ cấu hình Chatbot AI toàn hệ thống (chỉ Admin chỉnh sửa, lưu trong `system.Setting`)."""

from typing import Any

from django.conf import settings

from app.core.exceptions.validation_error import ValidationError
from app.system.constants.setting_key import SettingKey
from app.system.services.attachment_service import AttachmentService
from app.system.services.setting_service import SettingService
from app.system.services.telegram_bot_service import TelegramBotService
from app.workspace.constants.assistant_launcher_size import AssistantLauncherSize
from app.workspace.constants.group_tool_policy import GroupToolPolicy
from app.workspace.constants.workspace_defaults import (
    ASSISTANT_COMMANDS,
    DEFAULT_ASSISTANT_SYSTEM_PROMPT,
)

VALID_GROUP_POLICIES = frozenset(item.value for item in GroupToolPolicy)
VALID_LAUNCHER_SIZES = frozenset(item.value for item in AssistantLauncherSize)


class AssistantConfigService:
    """Quản lý Avatar, Tên, Policy, Model ưu tiên, giới hạn token và chính sách Bot Telegram AI."""

    def __init__(
        self,
        setting_service: SettingService | None = None,
        attachment_service: AttachmentService | None = None,
        telegram_bot_service: TelegramBotService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc `system.SettingService`, `AttachmentService` và `TelegramBotService`."""
        self.setting_service = setting_service or SettingService()
        self.attachment_service = attachment_service or AttachmentService()
        self.telegram_bot_service = telegram_bot_service or TelegramBotService()

    def available_ai_models(self) -> list[str]:
        """Danh sách model AI hợp lệ từ ENV (`XKIRO_MODEL` + `XKIRO_FALLBACK_MODELS`)."""
        candidates = [settings.XKIRO_MODEL, *settings.XKIRO_FALLBACK_MODELS]
        seen: list[str] = []
        for item in candidates:
            cleaned = str(item or "").strip()
            if cleaned and cleaned not in seen:
                seen.append(cleaned)
        return seen

    def _raw_config(self) -> dict[str, Any]:
        stored = self.setting_service.get_setting_value(SettingKey.WORKSPACE_ASSISTANT_CONFIG, default={})
        raw = stored if isinstance(stored, dict) else {}
        prompt_raw = raw.get("assistant_system_prompt", DEFAULT_ASSISTANT_SYSTEM_PROMPT)
        return {
            "assistant_name": str(raw.get("assistant_name") or "").strip()[:80],
            "assistant_avatar_id": (
                str(raw["assistant_avatar_id"]).strip() if raw.get("assistant_avatar_id") else None
            ),
            "launcher_size": (
                str(raw.get("launcher_size"))
                if raw.get("launcher_size") in VALID_LAUNCHER_SIZES
                else str(AssistantLauncherSize.MEDIUM)
            ),
            "assistant_system_prompt": str(prompt_raw or "").strip()[:2000],
            "preferred_ai_model": str(raw.get("preferred_ai_model") or "").strip()[:120],
            "ai_daily_token_limit": (
                int(raw["ai_daily_token_limit"]) if raw.get("ai_daily_token_limit") is not None else None
            ),
            "telegram_ai_enabled": bool(raw.get("telegram_ai_enabled", True)),
            "telegram_group_require_mention": bool(raw.get("telegram_group_require_mention", True)),
            "telegram_group_tool_policy": (
                str(raw.get("telegram_group_tool_policy"))
                if raw.get("telegram_group_tool_policy") in VALID_GROUP_POLICIES
                else str(GroupToolPolicy.OWNER_ONLY)
            ),
            "telegram_group_hide_amounts": bool(raw.get("telegram_group_hide_amounts", False)),
            "telegram_group_reply_in_dm": bool(raw.get("telegram_group_reply_in_dm", False)),
        }

    def get_config(self) -> dict[str, Any]:
        """Đọc trọn bộ cấu hình Chatbot AI cho màn Admin."""
        raw = self._raw_config()
        avatar = None
        if raw["assistant_avatar_id"]:
            avatar = self.attachment_service.find_alive_images([raw["assistant_avatar_id"]]).get(
                raw["assistant_avatar_id"]
            )
        bot_info = self.telegram_bot_service.bot_info()
        return {
            "assistant_name": raw["assistant_name"],
            "assistant_avatar": avatar,
            "launcher_size": raw["launcher_size"],
            "assistant_system_prompt": raw["assistant_system_prompt"],
            "preferred_ai_model": raw["preferred_ai_model"],
            "ai_daily_token_limit": raw["ai_daily_token_limit"],
            "telegram_ai_enabled": raw["telegram_ai_enabled"],
            "telegram_group_require_mention": raw["telegram_group_require_mention"],
            "telegram_group_tool_policy": raw["telegram_group_tool_policy"],
            "telegram_group_hide_amounts": raw["telegram_group_hide_amounts"],
            "telegram_group_reply_in_dm": raw["telegram_group_reply_in_dm"],
            "available_ai_models": self.available_ai_models(),
            "telegram_bot_configured": bool(bot_info.get("configured")),
            "telegram_bot_username": str(bot_info.get("username") or ""),
            "telegram_bot_url": str(bot_info.get("url") or ""),
            "telegram_commands": [dict(item) for item in ASSISTANT_COMMANDS],
        }

    def get_bot_profile(self) -> dict[str, Any]:
        """Thông tin tối giản chỉ đọc cho người dùng Portal hiển thị trên nút & popup chat."""
        cfg = self.get_config()
        models = cfg["available_ai_models"]
        active_model = cfg["preferred_ai_model"] or (models[0] if models else "")
        return {
            "name": cfg["assistant_name"],
            "avatar": cfg["assistant_avatar"],
            "launcher_size": cfg["launcher_size"],
            "active_model": active_model,
            "has_custom_policy": bool(cfg["assistant_system_prompt"]),
        }

    def update_config(self, actor: Any, data: dict[str, Any]) -> dict[str, Any]:
        """Kiểm tra chặt chẽ Avatar công khai, Kích thước nút, Model, Policy và lưu cấu hình Bot AI."""
        current = self._raw_config()
        payload = dict(data)

        if "preferred_ai_model" in payload:
            model_name = str(payload["preferred_ai_model"] or "").strip()
            allowed_models = self.available_ai_models()
            if model_name and allowed_models and model_name not in allowed_models:
                raise ValidationError(
                    "Model AI ưu tiên không nằm trong danh sách hỗ trợ.",
                    details={"preferred_ai_model": ["Model AI không thuộc danh sách cho phép."]},
                )
            current["preferred_ai_model"] = model_name[:120]

        if "assistant_name" in payload:
            current["assistant_name"] = str(payload["assistant_name"] or "").strip()[:80]

        if "assistant_system_prompt" in payload:
            current["assistant_system_prompt"] = str(payload["assistant_system_prompt"] or "").strip()[:2000]

        if "assistant_avatar_id" in payload:
            avatar_id = payload["assistant_avatar_id"]
            if avatar_id:
                img = self.attachment_service.get_image(avatar_id, actor=actor)
                current["assistant_avatar_id"] = str(img.pk)
            else:
                current["assistant_avatar_id"] = None

        if "launcher_size" in payload:
            size = str(payload["launcher_size"] or "").strip()
            if size not in VALID_LAUNCHER_SIZES:
                raise ValidationError(
                    details={"launcher_size": ["Kích thước nút tròn Trợ lý AI không hợp lệ."]}
                )
            current["launcher_size"] = size

        if "ai_daily_token_limit" in payload:
            limit_val = payload["ai_daily_token_limit"]
            current["ai_daily_token_limit"] = int(limit_val) if limit_val is not None else None

        for bool_field in (
            "telegram_ai_enabled",
            "telegram_group_require_mention",
            "telegram_group_hide_amounts",
            "telegram_group_reply_in_dm",
        ):
            if bool_field in payload:
                current[bool_field] = bool(payload[bool_field])

        if "telegram_group_tool_policy" in payload:
            policy = str(payload["telegram_group_tool_policy"] or "").strip()
            if policy not in VALID_GROUP_POLICIES:
                raise ValidationError(
                    details={"telegram_group_tool_policy": ["Chính sách nhóm Telegram không hợp lệ."]}
                )
            current["telegram_group_tool_policy"] = policy

        self.setting_service.set_setting_value(
            SettingKey.WORKSPACE_ASSISTANT_CONFIG,
            current,
            description="Cấu hình Chatbot AI toàn hệ thống (Avatar, Policy, Model, Token, Telegram).",
            category="assistant",
            is_public=False,
            actor=actor,
        )
        return self.get_config()
