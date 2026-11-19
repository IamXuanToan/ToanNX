"""Kiểm thử endpoint lịch sử thay đổi mã QR: GET /api/v1/qr_codes/codes/{id}/history."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.qr_codes.permissions.qr_code_permission import QrCodePermission as P
from app.modules.qr_codes.tests.helpers.qr_test_helper import create_test_qr

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/qr_codes/codes"


class TestQrCodeHistoryApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/qr_codes/codes/{id}/history."""

    def test_history_success(self, user: Any, login: Any) -> None:
        """Lấy lịch sử thay đổi của mã QR thành công."""
        grant(user, P.CREATE, P.UPDATE, P.READ)
        api = login(user)

        # 1. Tạo qua API để sinh journal entry CREATE
        created = self.assert_success(
            api.post(
                BASE_URL,
                {"name": "Mã Gốc", "qr_type": "TEXT", "content": {"text": "hello"}},
                format="json",
            ),
            201,
        )

        # 2. Sửa qua API để sinh journal entry UPDATE
        self.assert_success(
            api.patch(f"{BASE_URL}/{created['id']}", {"name": "Mã Đã Đổi"}, format="json"), 200
        )

        # 3. Lấy lịch sử
        res = api.get(f"{BASE_URL}/{created['id']}/history")
        history = self.assert_success(res, 200)

        assert len(history) == 2
        assert [entry["action"] for entry in history] == ["UPDATE", "CREATE"]

    def test_history_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xem lịch sử QR của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.READ)
        other_user = UserFactory()
        other_qr = create_test_qr(other_user, name="QR Người Khác")

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_qr.pk}/history")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_history_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000/history")
        self.assert_unauthorized(res)

    def test_history_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền qr_codes.code.read bị 403."""
        qr = create_test_qr(user, name="QR")
        api = login(user)
        res = api.get(f"{BASE_URL}/{qr.pk}/history")
        self.assert_forbidden(res)
