"""Test GET /api/v1/system/auth/social/<provider>/url."""

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db


class TestSocialAuthUrlApi(BaseApiTestCase):
    """Lấy URL xác thực OAuth."""

    @override_settings(
        GOOGLE_OAUTH_CLIENT_ID="mock-google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET="mock-secret",
    )
    def test_google_url_success(self, client: APIClient) -> None:
        response = client.get(
            "/api/v1/system/auth/social/google/url",
            {"redirect_uri": "http://localhost:3001/auth/callback/google", "state": "test-state-123"},
        )
        data = self.assert_success(response)
        assert "authorization_url" in data
        assert "accounts.google.com" in data["authorization_url"]
        assert "client_id=mock-google-client-id" in data["authorization_url"]
        assert "state=test-state-123" in data["authorization_url"]

    @override_settings(
        GITHUB_OAUTH_CLIENT_ID="mock-github-client-id",
        GITHUB_OAUTH_CLIENT_SECRET="mock-secret",
    )
    def test_github_url_success(self, client: APIClient) -> None:
        response = client.get(
            "/api/v1/system/auth/social/github/url",
            {"redirect_uri": "http://localhost:3001/auth/callback/github", "state": "test-state-github"},
        )
        data = self.assert_success(response)
        assert "authorization_url" in data
        assert "github.com/login/oauth/authorize" in data["authorization_url"]
        assert "client_id=mock-github-client-id" in data["authorization_url"]

    def test_unsupported_provider(self, client: APIClient) -> None:
        response = client.get(
            "/api/v1/system/auth/social/facebook/url",
            {"redirect_uri": "http://localhost:3001/auth/callback", "state": "s"},
        )
        self.assert_error(response, 422, "ACCOUNT_SOCIAL_PROVIDER_UNSUPPORTED")

    @override_settings(
        GOOGLE_OAUTH_CLIENT_ID="mock-google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET="mock-secret",
    )
    def test_disabled_provider_rejected(self, client: APIClient) -> None:
        from app.system.models.setting import Setting

        Setting.objects.update_or_create(key="auth_google_enabled", defaults={"value": False})
        response = client.get(
            "/api/v1/system/auth/social/google/url",
            {"redirect_uri": "http://localhost:3001/auth/callback/google", "state": "test-state-123"},
        )
        self.assert_error(response, 422, "ACCOUNT_SOCIAL_PROVIDER_DISABLED")


    def test_missing_params(self, client: APIClient) -> None:
        response = client.get("/api/v1/system/auth/social/google/url")
        self.assert_error(response, 400, "VALIDATION_ERROR")
