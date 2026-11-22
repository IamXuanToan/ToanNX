"""Test POST /api/v1/system/auth/social/<provider>/login."""

from unittest.mock import MagicMock, patch

import pytest
from django.conf import settings
from django.test import override_settings
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.factories.user_social_account_factory import UserSocialAccountFactory
from app.system.types.oauth_user_info import OAuthUserInfo

pytestmark = pytest.mark.django_db


class TestSocialLoginApi(BaseApiTestCase):
    """Đăng nhập bằng tài khoản mạng xã hội (không cho phép đăng ký mới)."""

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="mock-id", GOOGLE_OAUTH_CLIENT_SECRET="mock-secret")
    def test_login_unlinked_returns_404(self, client: APIClient) -> None:
        mock_user_info = OAuthUserInfo(
            provider="google",
            uid="unlinked-google-id",
            email="newuser@gmail.com",
            display_name="New User",
            avatar_url="",
        )
        with patch(
            "app.system.services.google_oauth_service.GoogleOAuthService.get_user_info",
            return_value=mock_user_info,
        ):
            response = client.post(
                "/api/v1/system/auth/social/google/login",
                {"code": "mock-code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
            self.assert_error(response, 404, "ACCOUNT_SOCIAL_NOT_LINKED")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="mock-id", GOOGLE_OAUTH_CLIENT_SECRET="mock-secret")
    def test_login_linked_success(self, client: APIClient) -> None:
        user = UserFactory(email="connected@gmail.com", is_active=True)
        UserSocialAccountFactory(user=user, provider="google", uid="google-linked-123")

        mock_user_info = OAuthUserInfo(
            provider="google",
            uid="google-linked-123",
            email="connected@gmail.com",
            display_name="Connected User",
            avatar_url="https://lh3.googleusercontent.com/photo.jpg",
        )
        with patch(
            "app.system.services.google_oauth_service.GoogleOAuthService.get_user_info",
            return_value=mock_user_info,
        ):
            response = client.post(
                "/api/v1/system/auth/social/google/login",
                {"code": "valid-code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
            data = self.assert_success(response)
            assert data["user"]["email"] == user.email
            assert settings.AUTH_ACCESS_COOKIE_NAME in response.cookies
            assert settings.AUTH_REFRESH_COOKIE_NAME in response.cookies

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="mock-id", GOOGLE_OAUTH_CLIENT_SECRET="mock-secret")
    def test_login_inactive_user_returns_401(self, client: APIClient) -> None:
        user = UserFactory(email="inactive@gmail.com", is_active=False)
        UserSocialAccountFactory(user=user, provider="google", uid="google-inactive-123")

        mock_user_info = OAuthUserInfo(
            provider="google",
            uid="google-inactive-123",
            email="inactive@gmail.com",
            display_name="Inactive User",
        )
        with patch(
            "app.system.services.google_oauth_service.GoogleOAuthService.get_user_info",
            return_value=mock_user_info,
        ):
            response = client.post(
                "/api/v1/system/auth/social/google/login",
                {"code": "valid-code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
            self.assert_unauthorized(response, "AUTH_USER_INACTIVE")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="mock-id", GOOGLE_OAUTH_CLIENT_SECRET="mock-secret")
    def test_provider_rejects_code_returns_422(self, client: APIClient) -> None:
        """Google từ chối mã xác thực → 422 có mã lỗi riêng, không phải 500."""
        with patch(
            "app.system.services.google_oauth_service.requests.post",
            return_value=MagicMock(status_code=400),
        ):
            response = client.post(
                "/api/v1/system/auth/social/google/login",
                {"code": "bad-code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
        self.assert_error(response, 422, "ACCOUNT_SOCIAL_INVALID_CODE")

    def test_validation_error(self, client: APIClient) -> None:
        response = client.post(
            "/api/v1/system/auth/social/google/login",
            {"code": ""},
            format="json",
        )
        self.assert_error(response, 400, "VALIDATION_ERROR")
