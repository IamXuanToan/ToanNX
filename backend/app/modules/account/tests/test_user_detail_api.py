"""Kiểm thử endpoint chi tiết người dùng: GET /api/v1/account/users/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/account/users"


class TestUserDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/account/users/{id}."""

    def test_detail_user_success(self, superuser: User, user: User, login: Any) -> None:
        """Lấy thông tin chi tiết một người dùng thành công."""
        res = login(superuser).get(f"{URL}/{user.pk}")
        data = self.assert_success(res, 200)
        assert data["id"] == str(user.pk)
        assert data["email"] == user.email
        assert data["username"] == user.username
        self.assert_no_sensitive_data(res)

    def test_detail_not_found(self, superuser: User, login: Any) -> None:
        """ID không tồn tại trả về 404 NOT_FOUND."""
        res = login(superuser).get(f"{URL}/00000000-0000-0000-0000-000000000000")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, user: User, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{URL}/{user.pk}")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Người dùng thường thiếu quyền account.user.read bị 403."""
        other = UserFactory()
        api = login(user)
        res = api.get(f"{URL}/{other.pk}")
        self.assert_forbidden(res)
