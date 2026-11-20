"""Kiểm thử endpoint xóa hàng loạt mã QR: POST /api/v1/utilities/qr-codes/bulk-delete."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import create_test_qr

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/qr-codes/bulk-delete"


class TestQrCodeBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/qr-codes/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm hàng loạt mã QR của mình thành công."""
        grant(user, P.DELETE)
        qr1 = create_test_qr(user, name="QR 1")
        qr2 = create_test_qr(user, name="QR 2")

        api = login(user)
        res = api.post(URL, {"ids": [str(qr1.pk), str(qr2.pk)]}, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

        qr1.refresh_from_db()
        qr2.refresh_from_db()
        assert qr1.deleted_at is not None
        assert qr2.deleted_at is not None

    def test_bulk_delete_owner_isolation_other_user_404_rollback(self, user: Any, login: Any) -> None:
        """Lô xóa có chứa mã QR của người khác sẽ bị từ chối 404 và rollback toàn bộ."""
        grant(user, P.DELETE)
        other_user = UserFactory()
        qr_own = create_test_qr(user, name="QR Của Tôi")
        qr_other = create_test_qr(other_user, name="QR Người Khác")

        api = login(user)
        res = api.post(URL, {"ids": [str(qr_own.pk), str(qr_other.pk)]}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        qr_own.refresh_from_db()
        qr_other.refresh_from_db()
        assert qr_own.deleted_at is None
        assert qr_other.deleted_at is None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
