"""Kiểm thử đọc Cài đặt cá nhân: GET /api/v1/workspace/settings & /settings/<owner_id>."""

import uuid
from typing import Any
from unittest.mock import patch

import pytest

from app.core.exceptions.conflict_error import ConflictError
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.permissions.workspace_setting_permission import WorkspaceSettingPermission as P
from app.workspace.services.workspace_setting_service import WorkspaceSettingService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/settings"


class TestWorkspaceSettingGetApi(BaseApiTestCase):
    """Kiểm thử GET tự khởi tạo cho chính chủ, không lộ cấu hình AI Bot của Admin và 404 khi missing."""

    def test_get_own_and_admin_by_owner(self, user: Any, login: Any, client: Any, settings: Any) -> None:
        settings.TELEGRAM_BOT_TOKEN = "123:TOKEN"
        settings.TELEGRAM_BOT_USERNAME = "helper_bot"

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        own = self.assert_success(api.get(URL))
        assert own["owner_id"] == str(user.pk)
        assert own["telegram_bot_configured"] is True
        assert own["telegram_bot_username"] == "helper_bot"
        assert "available_ai_models" not in own
        assert "assistant_system_prompt" not in own

        other = UserFactory()
        self.assert_forbidden(api.get(f"{URL}/{other.pk}"), "PERMISSION_DENIED")

        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        admin_api = login(user)
        other_setting = self.assert_success(admin_api.get(f"{URL}/{other.pk}"))
        assert other_setting["owner_id"] == str(other.pk)

        # `owner_id` không tồn tại → phải trả 404 và không tự tạo bản ghi rác.
        missing_uuid = uuid.uuid4()
        self.assert_error(admin_api.get(f"{URL}/{missing_uuid}"), 404, "NOT_FOUND")
        assert WorkspaceSetting.objects.filter(owner_id=missing_uuid).exists() is False

    def test_get_or_create_handles_concurrent_conflict_gracefully(self, user: Any) -> None:
        """Hai request song song cùng khởi tạo WorkspaceSetting lần đầu không bị 409 Conflict."""
        service = WorkspaceSettingService()
        created_concurrently = WorkspaceSetting.objects.create(owner=user)
        with (
            patch.object(service.repository, "find_by_owner", side_effect=[None, created_concurrently]),
            patch.object(service.repository, "create", side_effect=ConflictError("duplicate owner")),
        ):
            resolved = service.get_or_create_for_owner(user)
        assert resolved.pk == created_concurrently.pk
