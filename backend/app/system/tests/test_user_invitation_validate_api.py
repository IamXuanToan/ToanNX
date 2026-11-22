"""Kiểm thử endpoint GET /api/v1/system/auth/invitation."""

import pytest
from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.services.user_invitation_service import UserInvitationService
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/invitation"


class TestUserInvitationValidateApi(BaseApiTestCase):
    """Kiểm thử API kiểm tra token lời mời."""

    def test_validate_invitation_success(self, client: APIClient) -> None:
        """Kiểm tra token lời mời hợp lệ trả về thông tin người dùng."""
        user = UserFactory(full_name="Nguyễn Văn A", username="nguyenvana")
        user.set_unusable_password()
        user.save()

        service = UserInvitationService()
        token = service.generate_token(user)

        res = client.get(f"{URL}?token={token}")
        data = self.assert_success(res, 200)
        assert data["email"] == user.email
        assert data["full_name"] == "Nguyễn Văn A"
        assert data["username"] == "nguyenvana"

    def test_validate_missing_token_returns_400(self, client: APIClient) -> None:
        """Thiếu param token trả về 400 VALIDATION_ERROR."""
        res = client.get(URL)
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_validate_invalid_token_returns_400(self, client: APIClient) -> None:
        """Token không hợp lệ trả về 400 ACCOUNT_INVITATION_TOKEN_INVALID."""
        res = client.get(f"{URL}?token=fake_token_123")
        self.assert_error(res, 400, "ACCOUNT_INVITATION_TOKEN_INVALID")
