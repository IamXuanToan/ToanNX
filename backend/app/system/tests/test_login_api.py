"""Test POST /auth/login."""

from typing import Any

import pytest
from django.conf import settings
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.refresh_token import RefreshToken
from app.system.services.refresh_token_service import RefreshTokenService
from app.system.tests.factories.user_factory import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db

LOGIN = "/api/v1/system/auth/login"


class TestLogin(BaseApiTestCase):
    """Đăng nhập."""

    def test_success_sets_secure_cookies(self, client: APIClient, user: Any) -> None:
        response = client.post(
            LOGIN, {"identifier": user.email.upper(), "password": DEFAULT_PASSWORD}, format="json"
        )
        data = self.assert_success(response)
        assert data["user"]["email"] == user.email
        self.assert_no_sensitive_data(response)
        access = response.cookies[settings.AUTH_ACCESS_COOKIE_NAME]
        refresh = response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]
        hint = response.cookies[settings.AUTH_SESSION_HINT_COOKIE_NAME]
        assert access["httponly"] and refresh["httponly"] and hint["httponly"]
        assert access["path"] == "/api"
        assert refresh["path"] == "/api/v1/system/auth"
        assert refresh["samesite"] == "Strict"
        assert hint.value == "1"

    def test_refresh_token_stored_as_hash_only(self, client: APIClient, user: Any) -> None:
        response = client.post(LOGIN, {"identifier": user.email, "password": DEFAULT_PASSWORD}, format="json")
        raw = response.cookies[settings.AUTH_REFRESH_COOKIE_NAME].value
        assert not RefreshToken.objects.filter(token_hash=raw).exists()
        assert RefreshToken.objects.filter(token_hash=RefreshTokenService().hash_token(raw)).exists()

    def test_invalid_password(self, client: APIClient, user: Any) -> None:
        response = client.post(LOGIN, {"identifier": user.email, "password": "wrong-password"}, format="json")
        self.assert_unauthorized(response, "AUTH_INVALID_CREDENTIALS")

    def test_unknown_email_same_error(self, client: APIClient) -> None:
        response = client.post(LOGIN, {"identifier": "nobody@toannx.test", "password": "x"}, format="json")
        self.assert_unauthorized(response, "AUTH_INVALID_CREDENTIALS")

    def test_inactive_user(self, client: APIClient) -> None:
        inactive = UserFactory(is_active=False)
        response = client.post(
            LOGIN, {"identifier": inactive.email, "password": DEFAULT_PASSWORD}, format="json"
        )
        self.assert_unauthorized(response, "AUTH_USER_INACTIVE")

    def test_validation_error(self, client: APIClient) -> None:
        error = self.assert_error(
            client.post(LOGIN, {"identifier": ""}, format="json"), 400, "VALIDATION_ERROR"
        )
        assert "identifier" in error["details"] and "password" in error["details"]

    def test_login_with_username(self, client: APIClient) -> None:
        user = UserFactory(username="toan.nx")
        response = client.post(LOGIN, {"identifier": "toan.nx", "password": DEFAULT_PASSWORD}, format="json")
        data = self.assert_success(response)
        assert data["user"]["id"] == str(user.pk)
        wrong = client.post(LOGIN, {"identifier": "TOAN.NX", "password": DEFAULT_PASSWORD}, format="json")
        self.assert_unauthorized(wrong, "AUTH_INVALID_CREDENTIALS")
        legacy = client.post(LOGIN, {"email": user.email, "password": DEFAULT_PASSWORD}, format="json")
        self.assert_error(legacy, 400, "VALIDATION_ERROR")

    def test_rate_limited(self, client: APIClient, user: Any, settings: Any) -> None:
        settings.AUTH_LOGIN_RATE_LIMIT = 3
        for _ in range(3):
            client.post(LOGIN, {"identifier": user.email, "password": "wrong"}, format="json")
        response = client.post(LOGIN, {"identifier": user.email, "password": DEFAULT_PASSWORD}, format="json")
        self.assert_error(response, 429, "RATE_LIMITED")
        assert int(response["Retry-After"]) > 0

    def test_no_register_endpoint(self, client: APIClient) -> None:
        for path in ("/api/v1/system/auth/register", "/api/v1/system/auth/signup"):
            self.assert_error(client.post(path, {}, format="json"), 404, "NOT_FOUND")
