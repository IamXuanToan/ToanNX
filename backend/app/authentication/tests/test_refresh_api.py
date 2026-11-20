"""Test POST /auth/refresh (xoay vòng, hết hạn, thu hồi, reuse, đồng thời)."""

import threading
from datetime import timedelta
from typing import Any

import pytest
from django.conf import settings
from django.db import connection
from django.test import RequestFactory
from django.utils import timezone
from rest_framework.test import APIClient

from app.account.tests.factories.user_factory import DEFAULT_PASSWORD, UserFactory
from app.authentication.models.auth_session import AuthSession
from app.authentication.models.refresh_token import RefreshToken
from app.authentication.services.auth_service import AuthService
from app.authentication.services.refresh_token_service import RefreshTokenService
from app.core.exceptions.app_exception import AppException
from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db

REFRESH = "/api/v1/auth/refresh"


class TestRefresh(BaseApiTestCase):
    """Refresh token xoay vòng."""

    def test_success_rotates_token(self, user: Any, login: Any, refresh_cookie: Any) -> None:
        api = login(user)
        old = refresh_cookie(api)
        self.assert_success(api.post(REFRESH))
        new = refresh_cookie(api)
        assert new and new != old
        old_record = RefreshToken.objects.get(token_hash=RefreshTokenService.hash_token(old))
        assert old_record.rotated_at is not None
        assert old_record.replaced_by is not None

    def test_missing_cookie(self, client: APIClient) -> None:
        self.assert_unauthorized(client.post(REFRESH), "AUTH_REFRESH_INVALID")

    def test_expired(self, user: Any, login: Any) -> None:
        api = login(user)
        AuthSession.objects.filter(user=user).update(expires_at=timezone.now() - timedelta(seconds=1))
        response = api.post(REFRESH)
        self.assert_unauthorized(response, "AUTH_REFRESH_EXPIRED")
        assert response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value == ""

    def test_revoked(self, user: Any, login: Any) -> None:
        api = login(user)
        AuthSession.objects.filter(user=user).update(revoked_at=timezone.now())
        self.assert_unauthorized(api.post(REFRESH), "AUTH_REFRESH_REVOKED")

    def test_reuse_after_grace_revokes_session(
        self, user: Any, login: Any, refresh_cookie: Any, settings: Any
    ) -> None:
        settings.AUTH_REFRESH_REUSE_GRACE_SECONDS = 0
        api = login(user)
        stolen = refresh_cookie(api)
        self.assert_success(api.post(REFRESH))
        attacker = APIClient()
        attacker.cookies[settings.AUTH_REFRESH_COOKIE_NAME] = stolen
        self.assert_unauthorized(attacker.post(REFRESH), "AUTH_REFRESH_REUSED")
        # Phiên bị thu hồi: cả người dùng hợp lệ cũng phải đăng nhập lại.
        assert AuthSession.objects.get(user=user).revoked_reason == "reuse_detected"
        self.assert_unauthorized(api.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")

    def test_reuse_within_grace_is_conflict(self, user: Any, login: Any, refresh_cookie: Any) -> None:
        api = login(user)
        previous = refresh_cookie(api)
        self.assert_success(api.post(REFRESH))
        other_tab = APIClient()
        other_tab.cookies[settings.AUTH_REFRESH_COOKIE_NAME] = previous
        self.assert_error(other_tab.post(REFRESH), 409, "AUTH_REFRESH_CONFLICT")
        assert AuthSession.objects.get(user=user).revoked_at is None


@pytest.mark.django_db(transaction=True)
def test_concurrent_refresh_only_one_rotation() -> None:
    """Hai request refresh đồng thời cùng token: đúng một thành công, một nhận 409."""
    user = UserFactory()
    raw = AuthService().login(RequestFactory().post(REFRESH), user.email, DEFAULT_PASSWORD).refresh_token
    barrier = threading.Barrier(2)
    outcomes: list[str] = []

    def worker() -> None:
        barrier.wait()
        try:
            AuthService().refresh(RequestFactory().post(REFRESH), raw)
            outcomes.append("ok")
        except AppException as exc:
            outcomes.append(str(exc.code))
        finally:
            connection.close()

    threads = [threading.Thread(target=worker) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert sorted(outcomes) == ["AUTH_REFRESH_CONFLICT", "ok"]
    assert RefreshToken.objects.filter(session__user=user, rotated_at__isnull=True).count() == 1
