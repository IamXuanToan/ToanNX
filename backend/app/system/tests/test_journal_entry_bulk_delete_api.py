"""Kiểm thử endpoint xóa lô nhật ký: POST /api/v1/system/journal-entries/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.journal_entry import JournalEntry
from app.system.models.user import User
from app.system.permissions.journal_entry_permission import JournalEntryPermission as P
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/journal-entries/bulk-delete"
ROLES_URL = "/api/v1/system/roles"


def _entry(superuser: User, login: Any, code: str) -> JournalEntry:
    """Sinh một mục nhật ký thật bằng cách tạo vai trò."""
    role = login(superuser).post(ROLES_URL, {"code": code, "name": code}, format="json").json()["data"]
    return JournalEntry.objects.get(object_id=role["id"], action="CREATE")


class TestJournalEntryBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/journal-entries/bulk-delete."""

    def test_bulk_delete_success(self, user: User, superuser: User, login: Any) -> None:
        """Xóa hẳn cả lô, trả số mục đã xử lý."""
        entries = [_entry(superuser, login, "JBULK_A"), _entry(superuser, login, "JBULK_B")]
        grant(user, P.ENTRY_DELETE)

        res = login(user).post(URL, {"ids": [str(entry.pk) for entry in entries]}, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2
        assert not JournalEntry.objects.filter(pk__in=[entry.pk for entry in entries]).exists()

    def test_bulk_delete_validation_missing_ids(self, user: User, login: Any) -> None:
        """Thiếu `ids` bị 400 VALIDATION_ERROR."""
        grant(user, P.ENTRY_DELETE)
        error = self.assert_error(login(user).post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_unknown_id_rolls_back(self, user: User, superuser: User, login: Any) -> None:
        """Lô có id không tồn tại → 404 và không mục nào bị xóa (một transaction)."""
        entry = _entry(superuser, login, "JBULK_KEEP")
        grant(user, P.ENTRY_DELETE)

        payload = {"ids": [str(entry.pk), "00000000-0000-0000-0000-000000000000"]}
        self.assert_error(login(user).post(URL, payload, format="json"), 404, "NOT_FOUND")
        assert JournalEntry.objects.filter(pk=entry.pk).exists()

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": []}, format="json"))

    def test_bulk_delete_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền xóa bị 403."""
        grant(user, P.ENTRY_READ)
        self.assert_forbidden(login(user).post(URL, {"ids": []}, format="json"))
