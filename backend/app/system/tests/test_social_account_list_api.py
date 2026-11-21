"""Test GET /api/v1/system/auth/social/accounts."""

from typing import Any

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_social_account_factory import UserSocialAccountFactory

pytestmark = pytest.mark.django_db


class TestSocialAccountListApi(BaseApiTestCase):
    """Danh sách tài khoản mạng xã hội liên kết."""

    def test_unauthenticated_returns_401(self, client: APIClient) -> None:
        response = client.get("/api/v1/system/auth/social/accounts")
        self.assert_unauthorized(response)

    @override_settings(
        GOOGLE_OAUTH_CLIENT_ID="google-id",
        GOOGLE_OAUTH_CLIENT_SECRET="google-secret",
        GITHUB_OAUTH_CLIENT_ID="github-id",
        GITHUB_OAUTH_CLIENT_SECRET="github-secret",
    )
    def test_list_connected_accounts_success(self, login: Any, user: Any) -> None:
        UserSocialAccountFactory(
            user=user,
            provider="google",
            uid="my-google-id",
            email="my-google@gmail.com",
            display_name="Nguyen Van A",
        )

        client = login(user)
        response = client.get("/api/v1/system/auth/social/accounts")
        data = self.assert_success(response)
        assert isinstance(data, list)
        assert len(data) >= 2

        google = next(item for item in data if item["provider"] == "google")
        assert google["is_connected"] is True
        assert google["is_configured"] is True
        assert google["email"] == "my-google@gmail.com"

        github = next(item for item in data if item["provider"] == "github")
        assert github["is_connected"] is False
        assert github["is_configured"] is True
