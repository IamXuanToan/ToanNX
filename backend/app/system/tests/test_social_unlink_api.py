"""Test DELETE /api/v1/system/auth/social/<provider>/unlink."""

from typing import Any

import pytest
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_social_account_factory import UserSocialAccountFactory

pytestmark = pytest.mark.django_db


class TestSocialUnlinkApi(BaseApiTestCase):
    """Hủy liên kết tài khoản mạng xã hội."""

    def test_unauthenticated_returns_401(self, client: APIClient) -> None:
        response = client.delete("/api/v1/system/auth/social/google/unlink")
        self.assert_unauthorized(response)

    def test_unlink_not_found(self, login: Any, user: Any) -> None:
        client = login(user)
        response = client.delete("/api/v1/system/auth/social/google/unlink")
        self.assert_error(response, 404, "NOT_FOUND")

    def test_unlink_success(self, login: Any, user: Any) -> None:
        UserSocialAccountFactory(user=user, provider="google", uid="to-delete-123")
        client = login(user)
        response = client.delete("/api/v1/system/auth/social/google/unlink")
        data = self.assert_success(response)
        assert data["unlinked"] is True

    def test_cannot_unlink_last_when_no_password(self, login: Any, user: Any) -> None:
        UserSocialAccountFactory(user=user, provider="google", uid="only-social-login")
        client = login(user)

        # Đặt tài khoản không có mật khẩu hợp lệ
        user.set_unusable_password()
        user.save()

        response = client.delete("/api/v1/system/auth/social/google/unlink")
        self.assert_error(response, 422, "ACCOUNT_SOCIAL_CANNOT_UNLINK_LAST")
