"""Kiểm thử endpoint POST /api/v1/system/auth/send-verification-email."""

from typing import Any

import pytest
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/send-verification-email"


class TestEmailVerificationSendApi(BaseApiTestCase):
    """Kiểm thử API gửi lại email xác minh."""

    def test_unauthenticated_returns_401(self, client: APIClient) -> None:
        """Chưa đăng nhập trả về 401 AUTH_NOT_AUTHENTICATED."""
        res = client.post(URL)
        self.assert_unauthorized(res)

    def test_send_verification_email_success(self, login: Any) -> None:
        """Gửi email xác minh thành công cho người dùng chưa xác minh."""
        user = UserFactory(is_verified=False, email_verified_at=None)
        client = login(user)
        res = client.post(URL)
        data = self.assert_success(res, 200)
        assert "message" in data

    def test_already_verified_returns_400(self, login: Any) -> None:
        """Người dùng đã xác minh email trước đó trả về 400 ACCOUNT_EMAIL_ALREADY_VERIFIED."""
        user = UserFactory(is_verified=True)
        client = login(user)
        res = client.post(URL)
        self.assert_error(res, 400, "ACCOUNT_EMAIL_ALREADY_VERIFIED")
