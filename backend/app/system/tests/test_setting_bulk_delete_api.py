"""Kiểm thử endpoint xóa lô cài đặt: POST /api/v1/system/settings/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.setting import Setting
from app.system.models.user import User
from app.system.permissions.setting_permission import SettingPermission as P
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/settings/bulk-delete"


def _setting(key: str) -> Setting:
    """Một cài đặt tùy biến (không phải khóa hệ thống seed sẵn)."""
    return Setting.objects.create(key=key, value=True, description="Cài đặt thử")


class TestSettingBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/settings/bulk-delete."""

    def test_bulk_delete_success(self, user: User, login: Any) -> None:
        """Xóa mềm cả lô; hệ thống quay về giá trị mặc định trong code."""
        items = [_setting("bulk_test_a"), _setting("bulk_test_b")]
        grant(user, P.SETTING_DELETE)

        res = login(user).post(URL, {"ids": [str(item.pk) for item in items]}, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.deleted_at is not None

    def test_bulk_delete_validation_missing_ids(self, user: User, login: Any) -> None:
        """Thiếu `ids` bị 400 VALIDATION_ERROR."""
        grant(user, P.SETTING_DELETE)
        error = self.assert_error(login(user).post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": []}, format="json"))

    def test_bulk_delete_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.setting.delete bị 403."""
        grant(user, P.SETTING_READ)
        self.assert_forbidden(login(user).post(URL, {"ids": []}, format="json"))
