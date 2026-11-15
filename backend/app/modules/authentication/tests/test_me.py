"""Test GET /auth/me và xác thực access token."""

from datetime import timedelta
from typing import Any

import jwt
import pytest
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession

pytestmark = pytest.mark.django_db

ME = "/api/v1/auth/me"


class TestMe(BaseApiTestCase):
    """Access token và endpoint /me."""

    def test_me(self, user: Any, login: Any) -> None:
        data = self.assert_success(login(user).get(ME))
        assert data["user"]["id"] == str(user.pk)
        assert data["permissions"] == []
        assert "modules" not in data

    def test_unauthorized_without_token(self, client: APIClient) -> None:
        self.assert_unauthorized(client.get(ME), "AUTH_NOT_AUTHENTICATED")

    def test_invalid_jwt(self, client: APIClient) -> None:
        self.assert_unauthorized(client.get(ME, HTTP_AUTHORIZATION="Bearer not-a-jwt"), "AUTH_TOKEN_INVALID")

    def test_jwt_with_wrong_signature(self, client: APIClient, user: Any) -> None:
        forged = jwt.encode(
            {"sub": str(user.pk), "sid": "x", "typ": "access"},
            "wrong-signing-key-that-is-long-enough-123",
            algorithm="HS256",
        )
        self.assert_unauthorized(client.get(ME, HTTP_AUTHORIZATION=f"Bearer {forged}"), "AUTH_TOKEN_INVALID")

    def test_expired_jwt(self, client: APIClient, user: Any) -> None:
        session = AuthSession.objects.create(user=user, expires_at=timezone.now() + timedelta(days=1))
        now = timezone.now()
        expired = jwt.encode(
            {
                "sub": str(user.pk),
                "sid": str(session.pk),
                "typ": "access",
                "iat": int((now - timedelta(hours=1)).timestamp()),
                "exp": int((now - timedelta(minutes=1)).timestamp()),
                "iss": settings.JWT_ISSUER,
                "aud": settings.JWT_AUDIENCE,
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        )
        self.assert_unauthorized(client.get(ME, HTTP_AUTHORIZATION=f"Bearer {expired}"), "AUTH_TOKEN_EXPIRED")

    def test_deactivated_user_rejected_immediately(self, user: Any, login: Any) -> None:
        api = login(user)
        user.is_active = False
        user.save(update_fields=["is_active"])
        self.assert_unauthorized(api.get(ME), "AUTH_USER_INACTIVE")

    def test_activity_recorded_at_most_once_per_minute(self, user: Any, login: Any) -> None:
        api = login(user)
        user.refresh_from_db()
        assert user.last_login is not None
        assert user.last_seen_at == user.last_login
        first_seen = user.last_seen_at
        self.assert_success(api.get(ME))
        user.refresh_from_db()
        assert user.last_seen_at == first_seen
        AuthSession.objects.filter(user=user).update(last_used_at=timezone.now() - timedelta(minutes=2))
        self.assert_success(api.get(ME))
        user.refresh_from_db()
        assert user.last_seen_at is not None and user.last_seen_at > first_seen
