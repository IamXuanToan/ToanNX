"""Kiểm thử endpoint POST /api/v1/system/auth/verify-email."""

import pytest
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.services.email_verification_service import EmailVerificationService
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/verify-email"


class TestEmailVerificationVerifyApi(BaseApiTestCase):
    """Kiểm thử API xác minh email qua token."""

    def test_verify_email_success(self, client: APIClient) -> None:
        """Xác minh email thành công với token hợp lệ."""
        user = UserFactory(is_verified=False, email_verified_at=None)
        service = EmailVerificationService()
        token = service.generate_token(user)

        res = client.post(URL, {"token": token}, format="json")
        data = self.assert_success(res, 200)
        assert "message" in data

        user.refresh_from_db()
        assert user.is_verified is True
        assert user.email_verified_at is not None

    def test_verify_email_missing_token_returns_400(self, client: APIClient) -> None:
        """Thiếu token trả về 400 VALIDATION_ERROR."""
        res = client.post(URL, {}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_verify_email_invalid_token_returns_400(self, client: APIClient) -> None:
        """Token giả mạo trả về 400 ACCOUNT_EMAIL_VERIFICATION_TOKEN_INVALID."""
        res = client.post(URL, {"token": "invalid:fake:token"}, format="json")
        self.assert_error(res, 400, "ACCOUNT_EMAIL_VERIFICATION_TOKEN_INVALID")
