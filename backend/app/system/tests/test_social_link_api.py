"""Test POST /api/v1/system/auth/social/<provider>/link."""

from typing import Any
from unittest.mock import patch

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.factories.user_social_account_factory import UserSocialAccountFactory
from app.system.types.oauth_user_info import OAuthUserInfo

pytestmark = pytest.mark.django_db


class TestSocialLinkApi(BaseApiTestCase):
    """Liên kết tài khoản mạng xã hội."""

    def test_unauthenticated_returns_401(self, client: APIClient) -> None:
        response = client.post(
            "/api/v1/system/auth/social/google/link",
            {"code": "code", "redirect_uri": "uri"},
            format="json",
        )
        self.assert_unauthorized(response)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="id", GOOGLE_OAUTH_CLIENT_SECRET="secret")
    def test_link_success(self, login: Any, user: Any) -> None:
        mock_info = OAuthUserInfo(
            provider="google",
            uid="new-google-uid-123",
            email="google@example.com",
            display_name="Google Name",
            avatar_url="https://google.com/avatar.jpg",
        )
        with patch(
            "app.system.services.google_oauth_service.GoogleOAuthService.get_user_info",
            return_value=mock_info,
        ):
            client = login(user)
            response = client.post(
                "/api/v1/system/auth/social/google/link",
                {"code": "valid-code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
            data = self.assert_success(response)
            assert data["provider"] == "google"
            assert data["is_connected"] is True
            assert data["email"] == "google@example.com"

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="id", GOOGLE_OAUTH_CLIENT_SECRET="secret")
    def test_link_already_linked_to_another_user_returns_409(self, login: Any, user: Any) -> None:
        other_user = UserFactory()
        UserSocialAccountFactory(user=other_user, provider="google", uid="shared-uid-999")

        mock_info = OAuthUserInfo(
            provider="google",
            uid="shared-uid-999",
            email="shared@example.com",
        )
        with patch(
            "app.system.services.google_oauth_service.GoogleOAuthService.get_user_info",
            return_value=mock_info,
        ):
            client = login(user)
            response = client.post(
                "/api/v1/system/auth/social/google/link",
                {"code": "code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
            self.assert_error(response, 409, "ACCOUNT_SOCIAL_ALREADY_LINKED")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="id", GOOGLE_OAUTH_CLIENT_SECRET="secret")
    def test_link_provider_already_exists_returns_409(self, login: Any, user: Any) -> None:
        UserSocialAccountFactory(user=user, provider="google", uid="my-existing-uid")

        mock_info = OAuthUserInfo(
            provider="google",
            uid="another-google-uid",
            email="another@example.com",
        )
        with patch(
            "app.system.services.google_oauth_service.GoogleOAuthService.get_user_info",
            return_value=mock_info,
        ):
            client = login(user)
            response = client.post(
                "/api/v1/system/auth/social/google/link",
                {"code": "code", "redirect_uri": "http://localhost:3001/auth/callback/google"},
                format="json",
            )
            self.assert_error(response, 409, "ACCOUNT_SOCIAL_PROVIDER_EXISTS")
