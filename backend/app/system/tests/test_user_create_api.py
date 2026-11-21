"""Kiểm thử endpoint tạo người dùng: POST /api/v1/system/users."""

from typing import Any

import pytest
from django.contrib.auth.hashers import identify_hasher

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.user import User
from app.system.permissions.user_permission import UserPermission as A

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/users"


class TestUserCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/users."""

    def test_create_user_success(self, superuser: User, login: Any) -> None:
        """Tạo người dùng thành công, mã hóa mật khẩu và không để lộ dữ liệu nhạy cảm."""
        payload = {
            "username": "new_member",
            "email": "New@Toannx.test",
            "password": "V3ry-Str0ng-Pass",
            "full_name": "An",
        }
        res = login(superuser).post(URL, payload, format="json")
        data = self.assert_success(res, 201)
        self.assert_no_sensitive_data(res)

        assert data["email"] == "new@toannx.test"
        created = User.objects.get(email="new@toannx.test")
        assert created.created_by_id == superuser.pk
        assert identify_hasher(created.password)

    def test_create_user_min_data(self, superuser: User, login: Any) -> None:
        """Tạo người dùng với dữ liệu tối thiểu (không cần username)."""
        payload = {
            "email": "min_user@toannx.test",
            "password": "V3ry-Str0ng-Pass",
            "full_name": "Min User",
        }
        res = login(superuser).post(URL, payload, format="json")
        data = self.assert_success(res, 201)
        assert data["email"] == "min_user@toannx.test"
        assert data["full_name"] == "Min User"
        assert data["username"] is None

    def test_create_duplicate_email_conflict(self, superuser: User, user: User, login: Any) -> None:
        """Tạo email trùng nhau (không phân biệt hoa thường) bị 409 ACCOUNT_EMAIL_EXISTS."""
        payload = {
            "username": "new_member2",
            "email": user.email.upper(),
            "password": "V3ry-Str0ng-Pass",
            "full_name": "Nguyen Van A",
        }
        res = login(superuser).post(URL, payload, format="json")
        self.assert_error(res, 409, "ACCOUNT_EMAIL_EXISTS")

    def test_create_weak_password_rejected(self, superuser: User, login: Any) -> None:
        """Mật khẩu yếu bị từ chối 400 ACCOUNT_PASSWORD_WEAK."""
        payload = {
            "username": "weak_member",
            "email": "weak@toannx.test",
            "password": "123",
            "full_name": "Nguyen Van B",
        }
        res = login(superuser).post(URL, payload, format="json")
        self.assert_error(res, 400, "ACCOUNT_PASSWORD_WEAK")

    def test_create_unknown_field_rejected(self, superuser: User, login: Any) -> None:
        """Field không nằm trong schema bị 400 VALIDATION_ERROR."""
        payload = {
            "username": "member_unknown",
            "email": "unknown@toannx.test",
            "password": "V3ry-Str0ng-Pass",
            "role": "ADMIN",
        }
        error = self.assert_error(login(superuser).post(URL, payload, format="json"), 400, "VALIDATION_ERROR")
        assert "role" in error["details"]

    def test_staff_cannot_create_superuser(self, staff_with: Any, login: Any) -> None:
        """Staff thường có quyền USER_CREATE vẫn không thể tạo tài khoản superuser (403)."""
        member = staff_with(A.USER_CREATE)
        payload = {
            "username": "su_hack",
            "email": "su@toannx.test",
            "password": "V3ry-Str0ng-Pass",
            "full_name": "Su Hack",
            "is_superuser": True,
        }
        res = login(member).post(URL, payload, format="json")
        self.assert_forbidden(res, "ACCOUNT_PRIVILEGE_ESCALATION")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"username": "x", "email": "x@test.com", "password": "pass"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.user.create bị 403."""
        api = login(user)
        res = api.post(URL, {"username": "x", "email": "x@test.com", "password": "pass"}, format="json")
        self.assert_forbidden(res)
