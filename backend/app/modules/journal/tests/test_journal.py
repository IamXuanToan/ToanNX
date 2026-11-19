"""JournalTracker tự ghi lịch sử khi CRUD; API journal lọc theo module.model."""

from typing import Any

import pytest
from django.db import transaction

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.models.role import Role
from app.modules.iam.permissions.iam_permission import IamPermission
from app.modules.iam.repositories.role_repository import RoleRepository
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.journal.models.journal_entry import JournalEntry
from app.modules.journal.permissions.journal_entry_permission import JournalEntryPermission

pytestmark = pytest.mark.django_db

ROLES = "/api/v1/iam/roles"
ENTRIES = "/api/v1/journal/entries"


def _entries(resource: str, object_id: Any) -> list[JournalEntry]:
    return list(
        JournalEntry.objects.filter(resource=resource, object_id=str(object_id)).order_by("created_at")
    )


class TestJournalTracker(BaseApiTestCase):
    """Model kế thừa JournalTracker: tạo/sửa/xóa qua API đều có lịch sử."""

    def test_crud_records_create_update_delete(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        role = self.assert_success(api.post(ROLES, {"code": "TRACKED", "name": "Một"}, format="json"), 201)
        self.assert_success(api.patch(f"{ROLES}/{role['id']}", {"name": "Hai"}, format="json"))
        assert api.delete(f"{ROLES}/{role['id']}").status_code == 204

        entries = _entries("iam.role", role["id"])
        # Xóa vai trò = tắt rồi xóa mềm (RoleService.delete) nên có thêm một UPDATE `is_active`.
        assert [entry.action for entry in entries] == ["CREATE", "UPDATE", "UPDATE", "DELETE"]
        assert entries[2].changes == {"is_active": [True, False]}
        assert entries[0].changes["code"] == [None, "TRACKED"]
        assert entries[1].changes == {"name": ["Một", "Hai"]}
        assert all(entry.actor_id == superuser.pk for entry in entries)
        assert entries[0].actor_label == superuser.email

    def test_no_change_no_entry(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        role = self.assert_success(api.post(ROLES, {"code": "SAME", "name": "Giữ"}, format="json"), 201)
        self.assert_success(api.patch(f"{ROLES}/{role['id']}", {"name": "Giữ"}, format="json"))
        assert [entry.action for entry in _entries("iam.role", role["id"])] == ["CREATE"]

    def test_masked_field_keeps_no_value(self) -> None:
        user = UserFactory()
        user.set_password("Mot-mat-khau-moi-123")
        user.save(update_fields=["password"])
        entry = _entries("account.user", user.pk)[-1]
        assert entry.action == "UPDATE"
        assert entry.changes == {"password": ["***", "***"]}

    def test_rollback_drops_history(self) -> None:
        with pytest.raises(RuntimeError), transaction.atomic():
            role = RoleRepository().create(code="ROLLED", name="x")
            raise RuntimeError
        assert not JournalEntry.objects.filter(resource="iam.role", object_label__contains="ROLLED").exists()
        assert not Role.objects.filter(code="ROLLED").exists()
        assert role.pk is not None

    def test_update_where_on_tracked_field_is_recorded(self) -> None:
        repository = RoleRepository()
        role = repository.create(code="BULKTRACK", name="Cũ")
        assert repository.update_where({"name": "Mới"}, pk=role.pk) == 1
        assert _entries("iam.role", role.pk)[-1].changes == {"name": ["Cũ", "Mới"]}


class TestJournalApi(BaseApiTestCase):
    """Lịch sử từng bản ghi theo quyền đọc bản ghi; nhật ký chung cần `journal.entry.read`."""

    def test_record_history_follows_read_permission(self, superuser: User, user: User, login: Any) -> None:
        role = self.assert_success(
            login(superuser).post(ROLES, {"code": "HIST", "name": "Lịch sử"}, format="json"), 201
        )
        api = login(user)
        self.assert_forbidden(api.get(f"{ROLES}/{role['id']}/history"))
        grant(user, IamPermission.ROLE_READ)
        items = self.assert_success(api.get(f"{ROLES}/{role['id']}/history"))
        assert [item["action"] for item in items] == ["CREATE"]
        assert items[0]["resource"] == "iam.role"

    def test_entries_filter_by_resource_and_module(self, superuser: User, user: User, login: Any) -> None:
        admin = login(superuser)
        self.assert_success(admin.post(ROLES, {"code": "FILTERED", "name": "Lọc"}, format="json"), 201)
        api = login(user)
        self.assert_forbidden(api.get(ENTRIES))
        grant(user, JournalEntryPermission.ENTRY_READ)
        items, _ = self.assert_paginated(api.get(ENTRIES, {"page": 1, "resource": "iam.role"}))
        assert items and all(item["resource"] == "iam.role" for item in items)
        items = self.assert_success(api.get(ENTRIES, {"module": "iam,journal"}))
        assert all(item["resource"].startswith("iam.") for item in items)
        resources = self.assert_success(api.get("/api/v1/journal/resources"))
        assert {"iam.role", "account.user", "short_links.shortlink"} <= {
            item["resource"] for item in resources
        }
        self.assert_error(api.get(ENTRIES, {"action": "NOPE"}), 400, "VALIDATION_ERROR")

    def test_role_assignment_is_an_event(self, superuser: User, login: Any) -> None:
        target = UserFactory()
        api = login(superuser)
        role = self.assert_success(
            api.post(ROLES, {"code": "EVENTED", "name": "Sự kiện"}, format="json"), 201
        )
        assert api.post(
            f"/api/v1/iam/users/{target.pk}/roles", {"role_id": role["id"]}, format="json"
        ).status_code in (
            200,
            201,
        )
        event = _entries("account.user", target.pk)[-1]
        assert (event.action, event.event) == ("EVENT", "iam.role_assigned")
        assert event.changes == {"role": [None, "EVENTED"]}
