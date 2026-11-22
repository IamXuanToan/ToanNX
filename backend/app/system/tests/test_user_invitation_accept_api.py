"""Kiểm thử endpoint POST /api/v1/system/auth/accept-invitation."""

import pytest
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.services.user_invitation_service import UserInvitationService
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/accept-invitation"


class TestUserInvitationAcceptApi(BaseApiTestCase):
    """Kiểm thử API chấp nhận lời mời và kích hoạt tài khoản."""

    def test_accept_invitation_success(self, client: APIClient) -> None:
        """Kích hoạt tài khoản thành công, đặt mật khẩu và tạo phiên đăng nhập."""
        user = UserFactory(full_name="", username=None, is_verified=False)
        user.set_unusable_password()
        user.save()

        service = UserInvitationService()
        token = service.generate_token(user)

        payload = {
            "token": token,
            "full_name": "Lê Văn B",
            "username": "levanb",
            "password": "StrongPassword123!@",
        }
        res = client.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["user"]["full_name"] == "Lê Văn B"
        assert data["user"]["username"] == "levanb"
        assert data["user"]["is_verified"] is True

        user.refresh_from_db()
        assert user.full_name == "Lê Văn B"
        assert user.username == "levanb"
        assert user.is_verified is True
        assert user.has_usable_password() is True
        assert user.check_password("StrongPassword123!@") is True

    def test_accept_invitation_weak_password_rejected(self, client: APIClient) -> None:
        """Mật khẩu yếu bị từ chối 400 ACCOUNT_PASSWORD_WEAK."""
        user = UserFactory()
        user.set_unusable_password()
        user.save()

        service = UserInvitationService()
        token = service.generate_token(user)

        payload = {
            "token": token,
            "full_name": "Lê Văn B",
            "password": "123",
        }
        res = client.post(URL, payload, format="json")
        self.assert_error(res, 400, "ACCOUNT_PASSWORD_WEAK")

    def test_token_cannot_be_reused(self, client: APIClient) -> None:
        """Token sau khi đã kích hoạt không thể dùng lại lần thứ 2."""
        user = UserFactory()
        user.set_unusable_password()
        user.save()

        service = UserInvitationService()
        token = service.generate_token(user)

        payload = {
            "token": token,
            "full_name": "User One",
            "password": "StrongPassword123!@",
        }
        # Lần 1: Thành công
        res1 = client.post(URL, payload, format="json")
        self.assert_success(res1, 200)

        # Lần 2: Thất bại vì mật khẩu đã được thiết lập (token đã dùng)
        res2 = client.post(URL, payload, format="json")
        self.assert_error(res2, 400, "ACCOUNT_INVITATION_TOKEN_INVALID")
