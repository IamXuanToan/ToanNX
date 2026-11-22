"""Kiểm thử endpoint yêu cầu đặt lại mật khẩu: POST /api/v1/system/auth/password-reset/request."""

from typing import Any

import pytest
from django.core import mail
from django.test import RequestFactory
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.utils.frontend_url import get_frontend_origin

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/password-reset/request"


class TestPasswordResetRequestApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/auth/password-reset/request."""

    def test_request_reset_existing_user_sends_email(self, client: APIClient, user: Any) -> None:
        """User tồn tại -> gửi email chứa đường link đặt lại mật khẩu."""
        mail.outbox.clear()
        res = client.post(URL, {"email": user.email, "locale": "vi"}, format="json")
        data = self.assert_success(res)
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
        res = client.post(
            URL,
            {"email": user.email, "locale": "vi"},
            format="json",
            HTTP_ORIGIN=custom_origin,
        )
        self.assert_success(res)
        assert len(mail.outbox) == 1
        assert custom_origin in mail.outbox[0].body

    def test_frontend_origin_resolution(self, settings: Any) -> None:
        """Hàm get_frontend_origin tự động giải quyết các header khác nhau."""
        settings.FRONTEND_URL = "http://localhost:3000"
        factory = RequestFactory()
        req_origin = factory.post(URL, HTTP_ORIGIN="https://dashboard.site.vn")
        assert get_frontend_origin(req_origin) == "https://dashboard.site.vn"

        req_referer = factory.post(URL, HTTP_REFERER="http://localhost:3005/vi/quen-mat-khau")
        assert get_frontend_origin(req_referer) == "http://localhost:3005"

        assert get_frontend_origin(None) == "http://localhost:3000"

    def test_request_reset_anti_enumeration(self, client: APIClient) -> None:
        """Email không tồn tại -> trả 200 thông báo tương tự, không gửi email (chống dò tài khoản)."""
        mail.outbox.clear()
        res = client.post(URL, {"email": "nonexistent@example.com"}, format="json")
        data = self.assert_success(res)
        assert "Nếu email tồn tại" in data["detail"]
        assert len(mail.outbox) == 0

    def test_request_reset_inactive_user_does_not_send_email(self, client: APIClient) -> None:
        """Tài khoản bị khóa -> không gửi email."""
        inactive_user = UserFactory(is_active=False)
        mail.outbox.clear()
        res = client.post(URL, {"email": inactive_user.email}, format="json")
        data = self.assert_success(res)
        assert "Nếu email tồn tại" in data["detail"]
        assert len(mail.outbox) == 0

    def test_send_email_async(self, user: Any) -> None:
        """Gửi email bất đồng bộ qua thread pool."""
        import time

        from app.system.services.email_service import EmailService

        mail.outbox.clear()
        EmailService().send_password_reset_email(user, "https://toannx.com/test", async_send=True)
        time.sleep(0.3)
        assert len(mail.outbox) == 1
