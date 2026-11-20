"""Kiểm thử endpoint chi tiết mã QR: GET /api/v1/utilities/qr-codes/{id}."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import create_test_qr

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/qr-codes"


class TestQrCodeDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/qr-codes/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết mã QR của chính mình thành công."""
        grant(user, P.READ)
        qr = create_test_qr(user, name="Chi Tiết QR", qr_type="TEXT", content={"text": "detail-content"})
        api = login(user)

        res = api.get(f"{BASE_URL}/{qr.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(qr.pk)
        assert data["name"] == "Chi Tiết QR"
        assert data["qr_type"] == "TEXT"
        assert data["owner_id"] == str(user.pk)
        assert data["image"]["id"] == str(qr.image_id)

    def test_detail_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xem QR của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.READ)
        other_user = UserFactory()
        other_qr = create_test_qr(
            other_user, name="QR Người Khác", qr_type="TEXT", content={"text": "foreign"}
        )

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_qr.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_manage_all_can_access_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì xem được QR của người khác."""
        grant(user, P.READ, P.MANAGE_ALL)
        other_user = UserFactory()
        other_qr = create_test_qr(
            other_user, name="QR Người Khác", qr_type="TEXT", content={"text": "foreign"}
        )

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_qr.pk}")
        data = self.assert_success(res, 200)
        assert data["id"] == str(other_qr.pk)

    def test_detail_not_found(self, user: Any, login: Any) -> None:
        """ID không tồn tại trả về 404 NOT_FOUND."""
        grant(user, P.READ)
        api = login(user)
        res = api.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.read bị 403."""
        qr = create_test_qr(user, name="QR")
        api = login(user)
        res = api.get(f"{BASE_URL}/{qr.pk}")
        self.assert_forbidden(res)
