"""Test CSRF cho endpoint dùng cookie."""

from typing import Any

import pytest
from django.conf import settings
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import DEFAULT_PASSWORD

pytestmark = pytest.mark.django_db

LOGIN = "/api/v1/auth/login"
CSRF = "/api/v1/auth/csrf"


class TestCsrf(BaseApiTestCase):
    """CSRF."""

    def test_login_without_token_rejected(self, csrf_client: APIClient, user: Any) -> None:
        response = csrf_client.post(
            LOGIN, {"identifier": user.email, "password": DEFAULT_PASSWORD}, format="json"
        )
        self.assert_forbidden(response, "AUTH_CSRF_FAILED")

    def test_login_with_token_accepted(self, csrf_client: APIClient, user: Any) -> None:
        token = self.assert_success(csrf_client.get(CSRF))["csrf_token"]
        response = csrf_client.post(
            LOGIN,
            {"identifier": user.email, "password": DEFAULT_PASSWORD},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assert_success(response)

    def test_cookie_authenticated_write_requires_csrf(self, csrf_client: APIClient, user: Any) -> None:
        token = csrf_client.get(CSRF).json()["data"]["csrf_token"]
        csrf_client.post(
            LOGIN,
            {"identifier": user.email, "password": DEFAULT_PASSWORD},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        # GET an toàn không cần CSRF; POST bằng cookie thì cần.
        self.assert_success(csrf_client.get("/api/v1/auth/me"))
        self.assert_forbidden(csrf_client.post("/api/v1/auth/logout-all"), "AUTH_CSRF_FAILED")

    def test_bearer_header_does_not_need_csrf(self, user: Any, login: Any) -> None:
        access = login(user).cookies[settings.AUTH_ACCESS_COOKIE_NAME].value
        fresh = APIClient(enforce_csrf_checks=True)
        self.assert_success(fresh.post("/api/v1/auth/logout-all", HTTP_AUTHORIZATION=f"Bearer {access}"))
