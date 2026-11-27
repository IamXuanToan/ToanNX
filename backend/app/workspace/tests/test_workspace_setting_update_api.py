"""Kiểm thử cập nhật Cài đặt Digest & Cảnh báo cá nhân: PUT/PATCH /api/v1/workspace/settings."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.telegram_chat import TelegramChat
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.permissions.workspace_setting_permission import WorkspaceSettingPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/settings"


class TestWorkspaceSettingUpdateApi(BaseApiTestCase):
    """Kiểm thử validate `digest_time_slots`, `digest_sections`, alert days, allowed chats & soft delete."""

    def test_update_personal_digest_alerts_and_allowed_chats(self, user: Any, login: Any) -> None:
        other = UserFactory()
        my_chat = TelegramChat.objects.create(
            owner=user, chat_id="-1001", title="Dev", status=TelegramChat.Status.ACTIVE, is_active=True
        )
        other_chat = TelegramChat.objects.create(
            owner=other, chat_id="-1002", title="Other", status=TelegramChat.Status.ACTIVE, is_active=True
        )

        grant(user, P.UPDATE)
        api = login(user)

        bad_slot = api.patch(URL, {"digest_time_slots": ["25:99"]}, format="json")
        self.assert_error(bad_slot, 400, "WORKSPACE_DIGEST_SLOT_INVALID")

        bad_section = api.patch(URL, {"digest_sections": ["monitors"]}, format="json")
        self.assert_error(bad_section, 400, "VALIDATION_ERROR")

        bad_chat = api.patch(URL, {"telegram_allowed_chat_ids": [str(other_chat.pk)]}, format="json")
        self.assert_error(bad_chat, 400, "VALIDATION_ERROR")

        res = api.patch(
            URL,
            {
                "timezone": "Asia/Ho_Chi_Minh",
                "daily_digest_enabled": True,
                "digest_time_slots": ["20:30", "08:00", "08:00"],
                "digest_sections": ["reminders", "finance"],
                "warranty_alert_days": [7, 30, 1],
                "subscription_default_alert_days": [1, 7],
                "telegram_allowed_chat_ids": [str(my_chat.pk)],
            },
            format="json",
        )
        data = self.assert_success(res)
        assert data["digest_time_slots"] == ["08:00", "20:30"]
        assert data["digest_sections"] == ["reminders", "finance"]
        assert data["warranty_alert_days"] == [30, 7, 1]
        assert data["subscription_default_alert_days"] == [7, 1]
        assert data["telegram_allowed_chat_ids"] == [str(my_chat.pk)]

        # Admin có MANAGE_ALL cập nhật múi giờ cho user khác
        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        admin_res = login(user).patch(
            f"{URL}/{other.pk}",
            {"timezone": "Asia/Tokyo", "daily_digest_enabled": False},
            format="json",
        )
        other_data = self.assert_success(admin_res)
        assert other_data["timezone"] == "Asia/Tokyo"
        assert other_data["daily_digest_enabled"] is False

        # Soft delete + UniqueConstraint cho phép tạo bản ghi mới cùng owner
        ws = WorkspaceSetting.objects.get(owner=other)
        ws.mark_deleted(user)
        ws.save(update_fields=["deleted_at", "deleted_by"])
        WorkspaceSetting.objects.create(owner=other)
        assert WorkspaceSetting.objects.alive().filter(owner=other).count() == 1
