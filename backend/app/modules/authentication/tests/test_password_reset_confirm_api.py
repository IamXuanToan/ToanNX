"""Kiểm thử endpoint xác nhận đặt lại mật khẩu: POST /api/v1/auth/password-reset/confirm."""

from typing import Any

import pytest
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import DEFAULT_PASSWORD

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/password-reset/confirm"
NEW_STRONG_PASSWORD = "StrongP@ssw0rd2026!"


class TestPasswordResetConfirmApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/auth/password-reset/confirm."""

    def test_confirm_reset_success_and_revokes_sessions(
        self, client: APIClient, user: Any, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        """Đặt lại mật khẩu thành công: mật khẩu mới hoạt động, token một lần, thu hồi phiên cũ."""
        user_client = login(user)
        self.assert_success(user_client.get("/api/v1/auth/me"))

        user.refresh_from_db()
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        with django_capture_on_commit_callbacks(execute=True):
            res = client.post(
                URL,
                {
                    "uid": uidb64,
                    "token": token,
                    "new_password": NEW_STRONG_PASSWORD,
                },
                format="json",
            )
        data = self.assert_success(res)
        assert "thành công" in data["detail"]

        # Mật khẩu mới xác thực được
        user.refresh_from_db()
        assert authenticate(username=user.email, password=NEW_STRONG_PASSWORD) is not None
        # Mật khẩu cũ không còn dùng được
        assert authenticate(username=user.email, password=DEFAULT_PASSWORD) is None

        # Token không thể dùng lần hai
        res_second = client.post(
            URL,
            {
                "uid": uidb64,
                "token": token,
                "new_password": "AnotherP@ssword2026!",
            },
            format="json",
        )
        self.assert_error(res_second, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")

        # Phiên đăng nhập cũ bị thu hồi -> gọi ME trả về 401
        self.assert_unauthorized(user_client.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")

    def test_confirm_reset_weak_password_rejected(self, client: APIClient, user: Any) -> None:
        """Mật khẩu yếu bị từ chối với ACCOUNT_PASSWORD_WEAK."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        res = client.post(
            URL,
            {
                "uid": uidb64,
                "token": token,
                "new_password": "123",
            },
            format="json",
        )
        self.assert_error(res, 400, "ACCOUNT_PASSWORD_WEAK")

    def test_confirm_reset_invalid_token(self, client: APIClient, user: Any) -> None:
        """Token không hợp lệ trả về 400 AUTH_PASSWORD_RESET_TOKEN_INVALID."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        res = client.post(
            URL,
            {
                "uid": uidb64,
                "token": "invalid-token",
                "new_password": NEW_STRONG_PASSWORD,
            },
            format="json",
        )
        self.assert_error(res, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")
