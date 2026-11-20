"""Kiểm thử endpoint xóa người dùng: DELETE /api/v1/system/users/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.auth_session import AuthSession
from app.system.models.user import User
from app.system.permissions.user_permission import UserPermission as A
from app.system.services.user_service import UserService
from app.system.tests.factories.superuser_factory import SuperuserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/users"


class TestUserDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/system/users/{id}."""

    def test_delete_soft_deletes_and_revokes_sessions(
        self, superuser: User, user: User, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        """Xóa mềm người dùng, vô hiệu hóa tài khoản và hủy toàn bộ phiên đăng nhập."""
        login(user)
        assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).exists()

        api = login(superuser)
        with django_capture_on_commit_callbacks(execute=True):
            res = api.delete(f"{URL}/{user.pk}")
        assert res.status_code == 204

        user.refresh_from_db()
        assert user.deleted_at is not None
        assert user.is_active is False
        assert not AuthSession.objects.filter(user=user, revoked_at__isnull=True).exists()

        # Kiểm tra chi tiết người dùng đã xóa trả về 404
        self.assert_error(login(superuser).get(f"{URL}/{user.pk}"), 404, "NOT_FOUND")

    def test_deleted_user_cannot_login(self, superuser: User, user: User, login: Any, client: Any) -> None:
        """Người dùng đã xóa không thể đăng nhập vào hệ thống."""
        login(superuser).delete(f"{URL}/{user.pk}")
        res = client.post(
            "/api/v1/system/auth/login",
            {"identifier": user.email, "password": "Str0ng-Passw0rd!"},
            format="json",
        )
        assert res.status_code in (400, 401)

    def test_cannot_delete_self(self, superuser: User, login: Any) -> None:
        """Người dùng không thể tự xóa tài khoản của chính mình (403 ACCOUNT_SELF_MODIFICATION)."""
        res = login(superuser).delete(f"{URL}/{superuser.pk}")
        self.assert_error(res, 403, "ACCOUNT_SELF_MODIFICATION")

    def test_staff_cannot_delete_superuser(self, staff_with: Any, login: Any) -> None:
        """Staff không thể xóa tài khoản của superuser (403 ACCOUNT_SUPERUSER_PROTECTED)."""
        actor = staff_with(A.USER_DELETE.code)
        target = SuperuserFactory()
        res = login(actor).delete(f"{URL}/{target.pk}")
        self.assert_error(res, 403, "ACCOUNT_SUPERUSER_PROTECTED")

    def test_delete_unauthenticated_rejected(self, user: User, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{URL}/{user.pk}")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, staff_with: Any, user: User, login: Any) -> None:
        """Staff thiếu quyền system.user.delete bị 403."""
        actor = staff_with(A.USER_READ.code)
        res = login(actor).delete(f"{URL}/{user.pk}")
        self.assert_forbidden(res)

    def test_deleted_user_email_can_be_reused(self) -> None:
        """Xóa mềm giải phóng email và username để có thể tạo lại tài khoản mới cùng thông tin."""
        actor = SuperuserFactory()
        data = {
            "email": "reuse@toannx.local",
            "username": "reuse_user",
            "password": "Reuse-Strong-Passw0rd!",
            "first_name": "A",
            "last_name": "B",
        }
        service = UserService()
        first = service.create(actor, dict(data))
        service.delete(actor, first.pk)
        second = service.create(actor, dict(data))
        assert second.email == "reuse@toannx.local" and second.pk != first.pk
