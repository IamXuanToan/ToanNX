"""Kiểm thử endpoint chi tiết nhật ký: GET /api/v1/journal/entries/{id}."""

from typing import Any

import pytest

from app.account.models.user import User
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.journal.models.journal_entry import JournalEntry
from app.journal.permissions.journal_entry_permission import JournalEntryPermission

pytestmark = pytest.mark.django_db
URL = "/api/v1/journal/entries"
ROLES_URL = "/api/v1/iam/roles"


class TestJournalEntryDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/journal/entries/{id}."""

    def test_entry_detail_has_changes_and_request_id(self, superuser: User, login: Any) -> None:
        """Chi tiết bản ghi nhật ký chứa đầy đủ changes, actor và request_id."""
        api = login(superuser)
        role = self.assert_success(
            api.post(ROLES_URL, {"code": "DETAIL_R", "name": "Một"}, format="json"), 201
        )
        self.assert_success(api.patch(f"{ROLES_URL}/{role['id']}", {"name": "Hai"}, format="json"))

        entry = JournalEntry.objects.get(object_id=role["id"], action="UPDATE")
        data = self.assert_success(api.get(f"{URL}/{entry.pk}"))
        assert data["changes"] == {"name": ["Một", "Hai"]}
        assert data["request_id"]

    def test_entry_detail_not_found(self, superuser: User, login: Any) -> None:
        """ID không tồn tại trả về 404 NOT_FOUND."""
        api = login(superuser)
        self.assert_error(api.get(f"{URL}/00000000-0000-0000-0000-000000000000"), 404, "NOT_FOUND")

    def test_entry_detail_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_entry_detail_forbidden(self, user: User, superuser: User, login: Any) -> None:
        """Người dùng thiếu quyền journal.entry.read bị 403."""
        api = login(superuser)
        role = self.assert_success(
            api.post(ROLES_URL, {"code": "FORBIDDEN_R", "name": "Quyền"}, format="json"), 201
        )
        entry = JournalEntry.objects.get(object_id=role["id"], action="CREATE")

        user_api = login(user)
        self.assert_forbidden(user_api.get(f"{URL}/{entry.pk}"))

        grant(user, JournalEntryPermission.ENTRY_READ)
        self.assert_success(user_api.get(f"{URL}/{entry.pk}"))
