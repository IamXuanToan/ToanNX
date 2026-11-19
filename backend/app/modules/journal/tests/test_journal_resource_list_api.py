"""Kiểm thử endpoint danh mục tài nguyên nhật ký: GET /api/v1/journal/resources."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.journal.permissions.journal_entry_permission import JournalEntryPermission

pytestmark = pytest.mark.django_db
URL = "/api/v1/journal/resources"


class TestJournalResourceListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/journal/resources."""

    def test_resources_include_field_labels(self, superuser: User, login: Any) -> None:
        """Danh mục tài nguyên trả về danh sách resource kèm field_labels để hiển thị giao diện."""
        data = self.assert_success(login(superuser).get(URL))
        assert {"iam.role", "account.user", "short_links.shortlink"} <= {
            item["resource"] for item in data
        }
        role = next(item for item in data if item["resource"] == "iam.role")
        assert role["field_labels"]["name"]

    def test_resources_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_resources_forbidden(self, user: User, login: Any) -> None:
        """Người dùng thường thiếu quyền journal.entry.read bị 403."""
        user_api = login(user)
        self.assert_forbidden(user_api.get(URL))

        grant(user, JournalEntryPermission.ENTRY_READ)
        self.assert_success(user_api.get(URL))
