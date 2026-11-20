"""Kiểm thử endpoint xóa hàng loạt vai trò: POST /api/v1/iam/roles/bulk-delete."""

from typing import Any

import pytest

from app.account.models.user import User
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.models.role import Role
from app.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/iam/roles/bulk-delete"


class TestRoleBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/iam/roles/bulk-delete."""

    def test_bulk_delete_success(self, superuser: User, login: Any) -> None:
        """Xóa mềm hàng loạt vai trò tùy chỉnh thành công."""
        roles = RoleFactory.create_batch(3)
        ids = [str(role.pk) for role in roles]
        api = login(superuser)

        data = self.assert_success(api.post(URL, {"ids": ids}, format="json"), 200)
        assert data["count"] == 3

    def test_bulk_delete_protected_system_role_rollback(self, superuser: User, login: Any) -> None:
        """Lô xóa có chứa vai trò hệ thống sẽ bị chặn 403 và rollback toàn bộ."""
        custom = RoleFactory()
        system = Role.objects.get(code="VIEWER")
        payload = {"ids": [str(custom.pk), str(system.pk)]}
        api = login(superuser)

        self.assert_error(api.post(URL, payload, format="json"), 403, "IAM_SYSTEM_ROLE_PROTECTED")

        custom.refresh_from_db()
        assert custom.deleted_at is None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền iam.role.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
