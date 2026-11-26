"""Kiểm thử Cấu hình Chatbot AI dùng chung (Admin): GET/PUT/PATCH /api/v1/workspace/assistant/config."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.permissions.assistant_config_permission import AssistantConfigPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/config"


class TestAssistantConfigApi(BaseApiTestCase):
    """Kiểm thử 401/403 cho member thường và GET/PATCH avatar công khai, Policy, Model bởi Admin."""

    def test_admin_config_crud_and_avatar_policy_validation(
        self, user: Any, superuser: Any, login: Any, client: Any, settings: Any
    ) -> None:
        settings.XKIRO_MODEL = "gpt-4o-mini"
        settings.XKIRO_FALLBACK_MODELS = ["gemini-2.5-flash"]

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")
        self.assert_forbidden(
            login(user).patch(URL, {"assistant_name": "Hack"}, format="json"), "PERMISSION_DENIED"
        )

        # User thường không nằm trong MEMBER cũng bị từ chối kể cả đã đăng nhập.
        grant(user, P.READ)
        member_api = login(user)
        initial = self.assert_success(member_api.get(URL))
        assert initial["available_ai_models"] == ["gpt-4o-mini", "gemini-2.5-flash"]
        assert "khủng bố" in initial["assistant_system_prompt"].lower()
        assert "quân sự" in initial["assistant_system_prompt"].lower()
        assert "phân biệt vùng miền" in initial["assistant_system_prompt"].lower()
        command_names = [item["command"] for item in initial["telegram_commands"]]
        assert "/hom_nay" in command_names
        assert "/tro_giup" in command_names
        assert "/xac_minh" in command_names
        self.assert_forbidden(
            member_api.patch(URL, {"assistant_name": "Nope"}, format="json"), "PERMISSION_DENIED"
        )

        # User có P.UPDATE (không có manage_all Attachment) bị chặn ảnh riêng tư/khác chủ.
        staff = UserFactory()
        other = UserFactory()
        grant(staff, P.READ, P.UPDATE, AttachmentPermission.FILE_READ)
        staff_public_img = Attachment.objects.create(
            created_by=staff,
            original_name="bot-avatar.png",
            content_type="image/png",
            size=64,
            visibility=Attachment.Visibility.PUBLIC,
            file="attachments/bot-avatar.png",
        )
        private_img = Attachment.objects.create(
            created_by=staff,
            original_name="secret.png",
            content_type="image/png",
            size=64,
            visibility=Attachment.Visibility.PRIVATE,
            file="private/secret.png",
        )
        other_img = Attachment.objects.create(
            created_by=other,
            original_name="other.png",
            content_type="image/png",
            size=64,
            visibility=Attachment.Visibility.PUBLIC,
            file="attachments/other.png",
        )
        staff_api = login(staff)
        self.assert_error(
            staff_api.patch(URL, {"assistant_avatar_id": str(private_img.pk)}, format="json"),
            400,
            "ATTACHMENT_MUST_BE_PUBLIC",
        )
        self.assert_error(
            staff_api.patch(URL, {"assistant_avatar_id": str(other_img.pk)}, format="json"),
            404,
            "NOT_FOUND",
        )

        # Admin cập nhật đầy đủ + kiểm tra model ngoài danh sách bị chặn.
        admin_api = login(superuser)
        self.assert_error(
            admin_api.patch(URL, {"preferred_ai_model": "unknown-model"}, format="json"),
            400,
            "VALIDATION_ERROR",
        )

        saved = self.assert_success(
            admin_api.patch(
                URL,
                {
                    "assistant_name": "  ToanNX Assistant  ",
                    "assistant_avatar_id": str(staff_public_img.pk),
                    "assistant_system_prompt": "  Trả lời súc tích tiếng Việt có dấu.  ",
                    "preferred_ai_model": "gemini-2.5-flash",
                    "ai_daily_token_limit": 5000,
                    "telegram_ai_enabled": True,
                    "telegram_group_require_mention": False,
                    "telegram_group_tool_policy": "ALL_MEMBERS",
                    "telegram_group_hide_amounts": True,
                    "telegram_group_reply_in_dm": True,
                },
                format="json",
            )
        )
        assert saved["assistant_name"] == "ToanNX Assistant"
        assert saved["assistant_avatar"]["id"] == str(staff_public_img.pk)
        assert saved["assistant_system_prompt"] == "Trả lời súc tích tiếng Việt có dấu."
        assert saved["preferred_ai_model"] == "gemini-2.5-flash"
        assert saved["ai_daily_token_limit"] == 5000
        assert saved["telegram_group_require_mention"] is False
        assert saved["telegram_group_tool_policy"] == "ALL_MEMBERS"
        assert saved["telegram_group_hide_amounts"] is True
        assert saved["telegram_group_reply_in_dm"] is True

        # Gỡ avatar bằng null qua PUT/PATCH
        cleared = self.assert_success(admin_api.put(URL, {"assistant_avatar_id": None}, format="json"))
        assert cleared["assistant_avatar"] is None
