"""Journal đủ cho trang chi tiết: field cũ → mới, nhãn field, request id, nhãn không dính hậu tố xóa mềm."""

from typing import Any

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role_permission import RolePermission
from app.modules.iam.services.role_permission_service import RolePermissionService
from app.modules.iam.services.user_role_service import UserRoleService
from app.modules.iam.tests.factories.role_factory import RoleFactory
from app.modules.journal.models.journal_entry import JournalEntry

pytestmark = pytest.mark.django_db

ROLES = "/api/v1/iam/roles"
ENTRIES = "/api/v1/journal/entries"


class TestJournalDetail(BaseApiTestCase):
    """Dữ liệu trang chi tiết nhật ký."""

    def test_entry_detail_has_changes_and_request_id(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        role = self.assert_success(api.post(ROLES, {"code": "DETAIL", "name": "Một"}, format="json"), 201)
        self.assert_success(api.patch(f"{ROLES}/{role['id']}", {"name": "Hai"}, format="json"))
        entry = JournalEntry.objects.get(object_id=role["id"], action="UPDATE")
        data = self.assert_success(api.get(f"{ENTRIES}/{entry.pk}"))
        assert data["changes"] == {"name": ["Một", "Hai"]}
        assert data["request_id"]

    def test_resources_include_field_labels(self, superuser: User, login: Any) -> None:
        data = self.assert_success(login(superuser).get(f"{ENTRIES[: -len('/entries')]}/resources"))
        role = next(item for item in data if item["resource"] == "iam.role")
        assert role["field_labels"]["name"]

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
