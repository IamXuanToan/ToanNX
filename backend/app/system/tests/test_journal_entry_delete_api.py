"""Kiểm thử endpoint xóa mục nhật ký: DELETE /api/v1/system/journal-entries/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.journal_entry import JournalEntry
from app.system.models.user import User
from app.system.permissions.journal_entry_permission import JournalEntryPermission as P
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/journal-entries"
ROLES_URL = "/api/v1/system/roles"


def _entry(superuser: User, login: Any, code: str) -> JournalEntry:
    """Sinh một mục nhật ký thật bằng cách tạo vai trò."""
    role = login(superuser).post(ROLES_URL, {"code": code, "name": code}, format="json").json()["data"]
    return JournalEntry.objects.get(object_id=role["id"], action="CREATE")


class TestJournalEntryDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/system/journal-entries/{id}."""

    def test_delete_success_hard_deletes(self, user: User, superuser: User, login: Any) -> None:
        """Xóa thành công (204) và mục bị xóa hẳn (nhật ký không có xóa mềm)."""
        entry = _entry(superuser, login, "JDEL_ONE")
        grant(user, P.ENTRY_DELETE)

        res = login(user).delete(f"{URL}/{entry.pk}")

        assert res.status_code == 204
        assert not JournalEntry.objects.filter(pk=entry.pk).exists()

    def test_delete_not_found(self, user: User, login: Any) -> None:
        """Id không tồn tại trả 404 NOT_FOUND."""
        grant(user, P.ENTRY_DELETE)
        res = login(user).delete(f"{URL}/00000000-0000-0000-0000-000000000000")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.delete(f"{URL}/00000000-0000-0000-0000-000000000000"))

    def test_delete_forbidden_without_permission(self, user: User, superuser: User, login: Any) -> None:
        """Chỉ có quyền đọc, thiếu system.journal_entry.delete bị 403 và mục còn nguyên."""
        entry = _entry(superuser, login, "JDEL_FORBID")
        grant(user, P.ENTRY_READ)

        self.assert_forbidden(login(user).delete(f"{URL}/{entry.pk}"))
        assert JournalEntry.objects.filter(pk=entry.pk).exists()
