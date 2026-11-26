"""Kiểm thử thông tin nhận diện Bot AI chỉ đọc: GET /api/v1/workspace/assistant/bot-profile."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.permissions.assistant_permission import AssistantPermission as P
from app.workspace.services.assistant_config_service import AssistantConfigService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/bot-profile"


class TestAssistantBotProfileApi(BaseApiTestCase):
    """Kiểm thử chỉ trả Avatar/Tên/Model hiển thị cho nút tròn và không lộ Policy nội bộ."""

    def test_get_bot_profile_and_permissions(
        self, user: Any, superuser: Any, login: Any, client: Any, settings: Any
    ) -> None:
        settings.XKIRO_MODEL = "gpt-4o-mini"
        settings.XKIRO_FALLBACK_MODELS = ["gemini-2.5-flash"]

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        AssistantConfigService().update_config(
            superuser,
            {
                "assistant_name": "Trợ lý ToanNX",
                "assistant_system_prompt": "Bí mật cấu hình nội bộ của Admin",
                "preferred_ai_model": "gemini-2.5-flash",
            },
        )
        grant(user, P.CHAT)
        data = self.assert_success(login(user).get(URL))
        assert data["name"] == "Trợ lý ToanNX"
        assert data["active_model"] == "gemini-2.5-flash"
        assert data["has_custom_policy"] is True
        assert "assistant_system_prompt" not in data
        assert "ai_daily_token_limit" not in data
