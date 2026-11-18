"""Test API và nghiệp vụ quên / đặt lại mật khẩu."""

from typing import Any

import pytest
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import DEFAULT_PASSWORD, UserFactory

pytestmark = pytest.mark.django_db

REQUEST_URL = "/api/v1/auth/password-reset/request"
VALIDATE_URL = "/api/v1/auth/password-reset/validate-token"
CONFIRM_URL = "/api/v1/auth/password-reset/confirm"
NEW_STRONG_PASSWORD = "StrongP@ssw0rd2026!"


class TestPasswordReset(BaseApiTestCase):
    """Bộ kiểm thử cho chức năng quên mật khẩu."""

    def test_request_reset_existing_user_sends_email(self, client: APIClient, user: Any) -> None:
        """User tồn tại -> gửi email chứa đường link đặt lại mật khẩu."""
        mail.outbox.clear()
        response = client.post(REQUEST_URL, {"email": user.email, "locale": "vi"}, format="json")
        data = self.assert_success(response)
        assert "Nếu email tồn tại" in data["detail"]

        assert len(mail.outbox) == 1
        sent = mail.outbox[0]
        assert sent.to == [user.email]
        assert "Đặt lại mật khẩu" in sent.subject
        assert "uid=" in sent.body
        assert "token=" in sent.body

    def test_request_reset_dynamic_origin(self, client: APIClient, user: Any) -> None:
        """Link đặt lại mật khẩu tự động lấy theo Origin của frontend gửi request (không hardcode)."""
        mail.outbox.clear()
        custom_origin = "https://custom-fe.example.com"
        response = client.post(
            REQUEST_URL,
            {"email": user.email, "locale": "vi"},
            format="json",
            HTTP_ORIGIN=custom_origin,
        )
        self.assert_success(response)
        assert len(mail.outbox) == 1
        assert custom_origin in mail.outbox[0].body

    def test_frontend_origin_resolution(self) -> None:
        """Hàm get_frontend_origin tự động giải quyết các header khác nhau."""
        from django.test import RequestFactory
        from app.modules.authentication.utils.frontend_url import get_frontend_origin

        factory = RequestFactory()

        # 1. Từ Origin
        req_origin = factory.post("/api/v1/auth/password-reset/request", HTTP_ORIGIN="https://dashboard.site.vn")
        assert get_frontend_origin(req_origin) == "https://dashboard.site.vn"

        # 2. Từ Referer
        req_referer = factory.post("/api/v1/auth/password-reset/request", HTTP_REFERER="http://localhost:3005/vi/quen-mat-khau")
        assert get_frontend_origin(req_referer) == "http://localhost:3005"

        # 3. None fallback
        assert get_frontend_origin(None) == "http://localhost:3000"

    def test_send_email_async(self, user: Any) -> None:
        """Gửi email bất đồng bộ qua thread pool."""
        import time
        from app.modules.authentication.services.email_service import EmailService

        mail.outbox.clear()
        EmailService.send_password_reset_email(user, "https://toannx.com/test", async_send=True)
        time.sleep(0.3)
        assert len(mail.outbox) == 1

    def test_request_reset_anti_enumeration(self, client: APIClient) -> None:
        """Email không tồn tại -> trả 200 thông báo tương tự, không gửi email."""
        mail.outbox.clear()
        response = client.post(REQUEST_URL, {"email": "nonexistent@example.com"}, format="json")
        data = self.assert_success(response)
        assert "Nếu email tồn tại" in data["detail"]
        assert len(mail.outbox) == 0

    def test_request_reset_inactive_user_does_not_send_email(self, client: APIClient) -> None:
        """Tài khoản bị khóa -> không gửi email."""
        inactive_user = UserFactory(is_active=False)
        mail.outbox.clear()
        response = client.post(REQUEST_URL, {"email": inactive_user.email}, format="json")
        data = self.assert_success(response)
        assert "Nếu email tồn tại" in data["detail"]
        assert len(mail.outbox) == 0

    def test_validate_token_success(self, client: APIClient, user: Any) -> None:
        """Token hợp lệ -> trả valid=True."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        response = client.post(VALIDATE_URL, {"uid": uidb64, "token": token}, format="json")
        data = self.assert_success(response)
        assert data["valid"] is True

    def test_validate_token_invalid(self, client: APIClient, user: Any) -> None:
        """Token sai -> trả lỗi 400 AUTH_PASSWORD_RESET_TOKEN_INVALID."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        response = client.post(VALIDATE_URL, {"uid": uidb64, "token": "invalid-token"}, format="json")
        self.assert_error(response, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")

    def test_validate_token_malformed_uid(self, client: APIClient) -> None:
        """UID không phải base64 hợp lệ -> trả lỗi 400 AUTH_PASSWORD_RESET_TOKEN_INVALID."""
        response = client.post(VALIDATE_URL, {"uid": "%%%invalid%%%", "token": "any-token"}, format="json")
        self.assert_error(response, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")

    def test_confirm_reset_success_and_revokes_sessions(
        self, client: APIClient, user: Any, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        """Đặt lại mật khẩu thành công: mật khẩu mới hoạt động, token không dùng lại được, phiên cũ bị thu hồi."""
        user_client = login(user)
        self.assert_success(user_client.get("/api/v1/auth/me"))

        user.refresh_from_db()
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        with django_capture_on_commit_callbacks(execute=True):
            response = client.post(
                CONFIRM_URL,
                {
                    "uid": uidb64,
                    "token": token,
                    "new_password": NEW_STRONG_PASSWORD,
                },
                format="json",
            )
        data = self.assert_success(response)
        assert "thành công" in data["detail"]

        # Mật khẩu mới xác thực được
        user.refresh_from_db()
        assert authenticate(username=user.email, password=NEW_STRONG_PASSWORD) is not None
        # Mật khẩu cũ không còn dùng được
        assert authenticate(username=user.email, password=DEFAULT_PASSWORD) is None

        # Token không thể dùng lần hai
        response_second = client.post(
            CONFIRM_URL,
            {
                "uid": uidb64,
                "token": token,
                "new_password": "AnotherP@ssword2026!",
            },
            format="json",
        )
        self.assert_error(response_second, 400, "AUTH_PASSWORD_RESET_TOKEN_INVALID")

        # Phiên đăng nhập cũ bị thu hồi -> gọi ME trả về 401
        self.assert_unauthorized(user_client.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")

    def test_confirm_reset_weak_password_rejected(self, client: APIClient, user: Any) -> None:
        """Mật khẩu yếu bị từ chối với ACCOUNT_PASSWORD_WEAK."""
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        response = client.post(
            CONFIRM_URL,
            {
                "uid": uidb64,
                "token": token,
                "new_password": "123",
            },
            format="json",
        )
        self.assert_error(response, 400, "ACCOUNT_PASSWORD_WEAK")
