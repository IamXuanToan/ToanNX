"""Nghiệp vụ Cài đặt Lịch Digest, Mốc cảnh báo cá nhân & liên kết Telegram cho từng user."""

from typing import Any

from django.db import IntegrityError, transaction

from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.system.services.telegram_chat_service import TelegramChatService
from app.system.services.user_service import UserService
from app.workspace.constants.workspace_defaults import ALLOWED_DIGEST_SECTIONS
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.permissions.workspace_setting_permission import WorkspaceSettingPermission
from app.workspace.repositories.workspace_setting_repository import WorkspaceSettingRepository
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService


class WorkspaceSettingService(CoreCrudService[WorkspaceSetting, WorkspaceSettingRepository]):
    """Quản lý cấu hình cá nhân; không tự tạo cho `owner_id` không tồn tại."""

    repository_class = WorkspaceSettingRepository
    owner_field = "owner"
    manage_all_permission = WorkspaceSettingPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: WorkspaceSettingRepository | None = None,
        user_service: UserService | None = None,
        telegram_chat_service: TelegramChatService | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo repository và các service phụ thuộc."""
        super().__init__(repository or WorkspaceSettingRepository())
        self.user_service = user_service or UserService()
        self.telegram_chat_service = telegram_chat_service or TelegramChatService()
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    @transaction.atomic
    def get_or_create_for_owner(self, owner: Any) -> WorkspaceSetting:
        """Lấy hoặc khởi tạo cấu hình mặc định cho một user có thật (an toàn khi gọi song song)."""
        existing = self.repository.find_by_owner(owner.pk)
        if existing is not None:
            return existing
        try:
            with transaction.atomic():
                created = self.repository.create(actor=owner, owner=owner)
        except (ConflictError, IntegrityError):
            concurrent = self.repository.find_by_owner(owner.pk)
            if concurrent is not None:
                return concurrent
            raise
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return created

    @transaction.atomic
    def get_for_target_owner(self, owner_id: Any) -> tuple[Any, WorkspaceSetting]:
        """Kiểm tra `owner_id` có tồn tại trong `system.User` trước khi lấy cấu hình (không có → 404)."""
        target_user = self.user_service.find_by_id(owner_id)
        if target_user is None:
            raise NotFoundError("Không tìm thấy người dùng.")
        return target_user, self.get_or_create_for_owner(target_user)

    @transaction.atomic
    def update_for_owner(self, actor: Any, owner_id: Any, data: dict[str, Any]) -> WorkspaceSetting:
        """Kiểm tra chặt chẽ các tùy chọn Digest, Mốc nhắc & Chat Telegram được phép rồi lưu."""
        target_user, instance = self.get_for_target_owner(owner_id)
        payload = dict(data)

        if "timezone" in payload:
            tz_value = str(payload["timezone"] or "").strip()
            if not self.tz_service.is_valid_zone(tz_value):
                raise ValidationError(
                    "Múi giờ IANA không hợp lệ.",
                    details={"timezone": ["Múi giờ IANA không hợp lệ (ví dụ Asia/Ho_Chi_Minh)."]},
                )
            payload["timezone"] = tz_value

        if "digest_time_slots" in payload:
            payload["digest_time_slots"] = self._normalize_slots(payload["digest_time_slots"])

        if "digest_sections" in payload:
            payload["digest_sections"] = self._normalize_sections(payload["digest_sections"])

        if "warranty_alert_days" in payload:
            payload["warranty_alert_days"] = self._normalize_positive_days(
                payload["warranty_alert_days"], "warranty_alert_days"
            )

        if "subscription_default_alert_days" in payload:
            payload["subscription_default_alert_days"] = self._normalize_positive_days(
                payload["subscription_default_alert_days"], "subscription_default_alert_days"
            )

        if "telegram_allowed_chat_ids" in payload:
            payload["telegram_allowed_chat_ids"] = self._validate_allowed_chats(
                target_user, payload["telegram_allowed_chat_ids"]
            )

        updated = self.repository.update(instance, actor=actor, **payload)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return updated

    @transaction.atomic
    def attach_telegram_owner_from_dm(self, owner: Any, telegram_user_id: int) -> WorkspaceSetting:
        """Gắn `telegram_owner_user_id` cho chính chủ khi xác minh qua Private DM."""
        setting = self.get_or_create_for_owner(owner)
        if setting.telegram_owner_user_id == telegram_user_id:
            return setting
        return self.repository.update(setting, actor=owner, telegram_owner_user_id=telegram_user_id)

    def _normalize_slots(self, raw_slots: Any) -> list[str]:
        if not isinstance(raw_slots, list):
            raise ValidationError(
                "Khung giờ Digest phải là danh sách.",
                code=WorkspaceErrorCode.DIGEST_SLOT_INVALID,
                details={"digest_time_slots": ["Định dạng danh sách không hợp lệ."]},
            )
        normalized: list[str] = []
        for item in raw_slots:
            cleaned = str(item or "").strip()
            if self.tz_service.parse_hhmm(cleaned) is None:
                raise ValidationError(
                    f"Khung giờ '{cleaned}' không đúng định dạng HH:MM.",
                    code=WorkspaceErrorCode.DIGEST_SLOT_INVALID,
                    details={
                        "digest_time_slots": [f"Khung giờ '{cleaned}' phải có dạng HH:MM (00:00–23:59)."]
                    },
                )
            if cleaned not in normalized:
                normalized.append(cleaned)
        return sorted(normalized)

    def _normalize_sections(self, raw_sections: Any) -> list[str]:
        if not isinstance(raw_sections, list):
            raise ValidationError(details={"digest_sections": ["Danh sách mục Digest không hợp lệ."]})
        cleaned: list[str] = []
        for item in raw_sections:
            name = str(item or "").strip()
            if name not in ALLOWED_DIGEST_SECTIONS:
                raise ValidationError(
                    details={"digest_sections": [f"Mục Digest '{name}' không được hỗ trợ."]}
                )
            if name not in cleaned:
                cleaned.append(name)
        return cleaned

    def _normalize_positive_days(self, raw_days: Any, field_name: str) -> list[int]:
        if not isinstance(raw_days, list):
            raise ValidationError(details={field_name: ["Danh sách số ngày không hợp lệ."]})
        days: list[int] = []
        for item in raw_days:
            try:
                value = int(item)
            except (TypeError, ValueError) as exc:
                raise ValidationError(details={field_name: ["Số ngày phải là số nguyên dương."]}) from exc
            if value < 0 or value > 365:
                raise ValidationError(details={field_name: ["Số ngày phải trong khoảng 0–365."]})
            if value not in days:
                days.append(value)
        return sorted(days, reverse=True)

    def _validate_allowed_chats(self, target_user: Any, raw_chat_ids: Any) -> list[str]:
        if not isinstance(raw_chat_ids, list):
            raise ValidationError(details={"telegram_allowed_chat_ids": ["Danh sách chat ID không hợp lệ."]})
        verified_ids = {str(chat.pk) for chat in self.telegram_chat_service.verified_for(target_user)}
        cleaned: list[str] = []
        for item in raw_chat_ids:
            chat_uuid = str(item or "").strip()
            if chat_uuid not in verified_ids:
                raise ValidationError(
                    "Chỉ được chọn chat Telegram đã kích hoạt của chính chủ.",
                    details={
                        "telegram_allowed_chat_ids": ["Có TelegramChat chưa xác minh hoặc không thuộc quyền."]
                    },
                )
            if chat_uuid not in cleaned:
                cleaned.append(chat_uuid)
        return cleaned
