"""Kiểm thử endpoint cập nhật cấu hình hệ thống: PATCH /api/v1/system/settings/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.setting import Setting
from app.system.models.user import User
from app.system.permissions.setting_permission import SettingPermission as A

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/settings"


class TestSettingUpdateApi(BaseApiTestCase):
    """Kiểm thử PATCH /api/v1/system/settings/{id}."""

    def test_update_setting_value_success(self, superuser: User, login: Any) -> None:
        """Cập nhật giá trị cấu hình thành công."""
        setting = Setting.objects.get(key="auth_google_enabled")
        res = login(superuser).patch(f"{URL}/{setting.pk}", {"value": False}, format="json")
        data = self.assert_success(res, 200)
        assert data["value"] is False
        setting.refresh_from_db()
        assert setting.value is False

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        setting = Setting.objects.get(key="auth_google_enabled")
        res = client.patch(f"{URL}/{setting.pk}", {"value": False}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Người dùng thường thiếu quyền system.setting.update bị 403."""
        setting = Setting.objects.get(key="auth_google_enabled")
        res = login(user).patch(f"{URL}/{setting.pk}", {"value": False}, format="json")
        self.assert_forbidden(res)
