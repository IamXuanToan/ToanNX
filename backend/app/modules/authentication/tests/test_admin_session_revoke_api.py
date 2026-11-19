"""Kiểm thử endpoint thu hồi một phiên quản trị: DELETE /api/v1/auth/admin-sessions/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.session_permission import SessionPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/admin-sessions"


class TestAdminSessionRevokeApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/auth/admin-sessions/{id}."""

    def test_revoke_invalidates_target_and_retains_history(self, staff: Any, user: Any, login: Any) -> None:
        """Thu hồi phiên của người dùng thành công và phiên bị vô hiệu hóa ngay lập tức."""
        target = login(user)
        session = AuthSession.objects.get(user=user)

        grant(staff, P.SESSION_READ)
        admin = login(staff)
        self.assert_forbidden(admin.delete(f"{URL}/{session.pk}"))

        grant(staff, P.SESSION_REVOKE)
        admin = login(staff)
        assert admin.delete(f"{URL}/{session.pk}").status_code == 204

        session.refresh_from_db()
        assert session.revoked_reason == "admin_revoked"
        assert session.revoked_at is not None
        self.assert_unauthorized(target.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")

    def test_staff_cannot_revoke_superuser_session(self, staff: Any, superuser: Any, login: Any) -> None:
        """Staff không thể thu hồi phiên của superuser (403)."""
        login(superuser)
        session = AuthSession.objects.get(user=superuser)
        grant(staff, P.SESSION_REVOKE)
        self.assert_forbidden(login(staff).delete(f"{URL}/{session.pk}"))

        session.refresh_from_db()
        assert session.revoked_at is None

    def test_admin_can_revoke_own_current_session(self, superuser: Any, login: Any) -> None:
        """Superuser có thể thu hồi chính phiên hiện tại của mình."""
        admin = login(superuser)
        current_session = AuthSession.objects.get(user=superuser)
        assert admin.delete(f"{URL}/{current_session.pk}").status_code == 204
        self.assert_unauthorized(admin.get("/api/v1/auth/me"))

    def test_revoke_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)
