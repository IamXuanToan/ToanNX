"""Kiểm thử cơ chế JournalTracker và ghi log thay đổi dữ liệu."""

from typing import Any

import pytest
from django.db import connection, transaction
from django.test.utils import CaptureQueriesContext

from app.account.models.user import User
from app.account.permissions.user_permission import UserPermission as A
from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.models.permission import Permission
from app.iam.models.role import Role
from app.iam.models.role_permission import RolePermission
from app.iam.permissions.iam_permission import IamPermission
from app.iam.repositories.role_repository import RoleRepository
from app.iam.services.role_permission_service import RolePermissionService
from app.iam.services.user_role_service import UserRoleService
from app.iam.tests.factories.role_factory import RoleFactory
from app.iam.tests.helpers.permission_helper import grant
from app.journal.models.journal_entry import JournalEntry

pytestmark = pytest.mark.django_db
ROLES = "/api/v1/iam/roles"


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

    def test_soft_delete_label_keeps_original_value(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        role = self.assert_success(api.post(ROLES, {"code": "LABEL_KEEP", "name": "Giữ"}, format="json"), 201)
        assert api.delete(f"{ROLES}/{role['id']}").status_code == 204
        entry = JournalEntry.objects.get(object_id=role["id"], action="DELETE")
        assert "_deleted_" not in entry.object_label
        assert entry.changes["code"][0] == "LABEL_KEEP"

    def test_revoke_permission_records_code(self, superuser: User, login: Any) -> None:
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_READ.code)
        RolePermission.objects.create(role=role, permission=permission)
        assert login(superuser).delete(f"{ROLES}/{role.pk}/permissions/{permission.pk}").status_code == 204
        entry = JournalEntry.objects.get(object_id=str(role.pk), event="iam.permission_revoked")
        assert entry.changes == {"permission": [None, A.USER_READ.code]}


def test_sync_permissions_records_before_after_and_constant_queries(superuser: User) -> None:
    role = RoleFactory()
    service = RolePermissionService()
    few = list(Permission.objects.filter(is_active=True).order_by("code")[:2])
    many = list(Permission.objects.filter(is_active=True).order_by("code")[:20])
    with CaptureQueriesContext(connection) as small:
        service.sync_permissions(superuser, role.pk, [item.pk for item in few])
    service.sync_permissions(superuser, role.pk, [])
    with CaptureQueriesContext(connection) as large:
        service.sync_permissions(superuser, role.pk, [item.pk for item in many])
    assert len(large.captured_queries) == len(small.captured_queries)
    entry = JournalEntry.objects.filter(object_id=str(role.pk), event="iam.permissions_changed").latest(
        "created_at"
    )
    assert entry.changes["permissions"] == [[], sorted(item.code for item in many)]


def test_sync_roles_records_before_after(superuser: User, user: User) -> None:
    first, second = RoleFactory(), RoleFactory()
    service = UserRoleService()
    service.sync_roles(superuser, user.pk, [first.pk])
    service.sync_roles(superuser, user.pk, [second.pk])
    entry = JournalEntry.objects.filter(object_id=str(user.pk), event="iam.roles_changed").latest(
        "created_at"
    )
    assert entry.changes["roles"] == [[first.code], [second.code]]
