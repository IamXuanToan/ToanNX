"""Test /auth/sessions và thu hồi phiên khi đổi mật khẩu."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.authentication.models.auth_session import AuthSession

pytestmark = pytest.mark.django_db

SESSIONS = "/api/v1/auth/sessions"
ME = "/api/v1/auth/me"


class TestSession(BaseApiTestCase):
    """Quản lý phiên."""

    def test_list_and_revoke_session(self, user: Any, login: Any) -> None:
        current, other = login(user), login(user)
        sessions = self.assert_success(current.get(SESSIONS))
        assert len(sessions) == 2
        assert sum(1 for item in sessions if item["is_current"]) == 1
        other_id = next(item["id"] for item in sessions if not item["is_current"])
        assert current.delete(f"{SESSIONS}/{other_id}").status_code == 204
        self.assert_unauthorized(other.get(ME), "AUTH_SESSION_INVALID")
        self.assert_success(current.get(ME))

    def test_cannot_revoke_other_users_session(self, user: Any, login: Any) -> None:
        stranger = UserFactory()
        login(stranger)
        session = AuthSession.objects.get(user=stranger)
        self.assert_error(login(user).delete(f"{SESSIONS}/{session.pk}"), 404, "NOT_FOUND")

    def test_password_change_revokes_sessions(
        self, superuser: Any, user: Any, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        user_api = login(user)
        admin = login(superuser)
        with django_capture_on_commit_callbacks(execute=True):
            response = admin.patch(
                f"/api/v1/account/users/{user.pk}", {"password": "An0ther-Str0ng-Pass"}, format="json"
            )
        self.assert_success(response)
        self.assert_unauthorized(user_api.get(ME), "AUTH_SESSION_INVALID")
