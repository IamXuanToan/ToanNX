"""Kiểm thử endpoint tạo vai trò: POST /api/v1/system/roles."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.user import User

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/roles"


class TestRoleCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/roles."""

    def test_create_role_success(self, superuser: User, login: Any) -> None:
        """Tạo vai trò tùy chỉnh thành công."""
        api = login(superuser)
        res = api.post(URL, {"code": "CONTENT_CREATOR", "name": "Người Tạo Nội Dung"}, format="json")
        data = self.assert_success(res, 201)

        assert data["code"] == "CONTENT_CREATOR"
        assert data["name"] == "Người Tạo Nội Dung"
        assert data["is_system"] is False
        assert data["permissions"] == []

    def test_create_duplicate_code_conflict(self, superuser: User, login: Any) -> None:
        """Trùng mã code vai trò bị 409 IAM_ROLE_CODE_EXISTS."""
        api = login(superuser)
        api.post(URL, {"code": "DUPLICATE_CODE", "name": "Gốc"}, format="json")

        res2 = api.post(URL, {"code": "DUPLICATE_CODE", "name": "Trùng"}, format="json")
        self.assert_error(res2, 409, "IAM_ROLE_CODE_EXISTS")

    def test_create_invalid_code_format(self, superuser: User, login: Any) -> None:
        """Mã vai trò chứa khoảng trắng hoặc ký tự không hợp lệ bị 400."""
        api = login(superuser)
        res = api.post(URL, {"code": "bad code with spaces", "name": "Sai"}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"code": "X", "name": "X"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Người dùng thiếu quyền system.role.create bị 403."""
        api = login(user)
        res = api.post(URL, {"code": "X", "name": "X"}, format="json")
        self.assert_forbidden(res)
