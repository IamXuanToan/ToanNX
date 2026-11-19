"""Kiểm thử endpoint danh sách quyền hạn: GET /api/v1/iam/permissions."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.iam.permissions.iam_permission import IamPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/iam/permissions"


class TestPermissionListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/iam/permissions."""

    def test_list_permissions_success(self, staff_with: Any, login: Any) -> None:
        """Staff có quyền iam.permission.read lấy được danh sách quyền, lọc theo module."""
        member = staff_with(P.PERMISSION_READ)
        api = login(member)

        res = api.get(URL, {"module": "iam"})
        data = self.assert_success(res, 200)

        codes = [item["code"] for item in data]
        assert P.ROLE_READ.code in codes
        assert all(code.startswith("iam.") for code in codes)

    def test_list_permissions_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_permissions_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền iam.permission.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
