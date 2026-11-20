"""Kiểm thử endpoint xác thực token đặt lại mật khẩu: POST /api/v1/auth/password-reset/validate-token."""

from typing import Any

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/password-reset/validate-token"


class TestPasswordResetValidateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/auth/password-reset/validate-token."""

    def test_validate_token_success(self, client: APIClient, user: Any) -> None:
        """Token hợp lệ -> trả valid=True."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        res = client.post(URL, {"uid": uidb64, "token": token}, format="json")
        data = self.assert_success(res)
        assert data["valid"] is True

    def test_validate_token_invalid(self, client: APIClient, user: Any) -> None:
        """Token sai -> trả lỗi 400 AUTH_PASSWORD_RESET_TOKEN_INVALID."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        res = client.post(URL, {"uid": uidb64, "token": "invalid-token"}, format="json")
        self.assert_error(res, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")

    def test_validate_token_malformed_uid(self, client: APIClient) -> None:
        """UID không phải base64 hợp lệ -> trả lỗi 400 AUTH_PASSWORD_RESET_TOKEN_INVALID."""
        res = client.post(URL, {"uid": "%%%invalid%%%", "token": "any-token"}, format="json")
        self.assert_error(res, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")
