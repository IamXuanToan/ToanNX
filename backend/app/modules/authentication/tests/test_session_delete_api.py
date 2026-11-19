"""Kiểm thử endpoint thu hồi một phiên cá nhân: DELETE /api/v1/auth/sessions/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.authentication.models.auth_session import AuthSession

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/sessions"


class TestSessionDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/auth/sessions/{id}."""

    def test_revoke_session_success(self, user: Any, login: Any) -> None:
        """Thu hồi phiên khác của chính mình thành công."""
        current, other = login(user), login(user)
        sessions = self.assert_success(current.get(URL))
        other_id = next(item["id"] for item in sessions if not item["is_current"])

        res = current.delete(f"{URL}/{other_id}")
        assert res.status_code == 204

        self.assert_unauthorized(other.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")
        self.assert_success(current.get("/api/v1/auth/me"))

    def test_cannot_revoke_other_users_session(self, user: Any, login: Any) -> None:
        """Không thể thu hồi phiên của người dùng khác (404 NOT_FOUND)."""
        stranger = UserFactory()
        login(stranger)
        session = AuthSession.objects.get(user=stranger)
        self.assert_error(login(user).delete(f"{URL}/{session.pk}"), 404, "NOT_FOUND")

    def test_delete_session_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)
