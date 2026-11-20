"""Kiểm thử endpoint danh sách nhật ký: GET /api/v1/system/journal-entries."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.user import User
from app.system.permissions.journal_entry_permission import JournalEntryPermission
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/journal-entries"
ROLES_URL = "/api/v1/system/roles"


class TestJournalEntryListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/system/journal-entries."""

    def test_list_entries_paginated_and_filter(self, superuser: User, user: User, login: Any) -> None:
        """Lấy danh sách nhật ký có phân trang và lọc theo resource/module."""
        admin = login(superuser)
        admin.post(ROLES_URL, {"code": "FILTERED_R", "name": "Lọc"}, format="json")

        api = login(user)
        # Thiếu quyền bị 403
        self.assert_forbidden(api.get(URL))

        grant(user, JournalEntryPermission.ENTRY_READ)
        items, meta = self.assert_paginated(api.get(URL, {"page": 1, "resource": "system.role"}))
        assert meta["total"] >= 1
        assert all(item["resource"] == "system.role" for item in items)

        # Lọc theo module
        items = self.assert_success(api.get(URL, {"module": "system,novel"}))
        assert items and all(item["resource"].startswith("system.") for item in items)

    def test_list_entries_validation_error(self, superuser: User, login: Any) -> None:
        """Tham số bộ lọc không hợp lệ trả về 400 VALIDATION_ERROR."""
        api = login(superuser)
        self.assert_error(api.get(URL, {"action": "INVALID_ACTION"}), 400, "VALIDATION_ERROR")

    def test_list_entries_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_entries_forbidden(self, user: User, login: Any) -> None:
        """Người dùng thường không có quyền system.journal_entry.read bị 403."""
        res = login(user).get(URL)
        self.assert_forbidden(res)
