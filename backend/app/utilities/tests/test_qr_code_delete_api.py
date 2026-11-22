"""Kiểm thử endpoint xóa mã QR: DELETE /api/v1/utilities/qr-codes/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import create_test_qr

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/qr-codes"


class TestQrCodeDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/utilities/qr-codes/{id}."""

    def test_delete_success_soft_deletes_image_too(self, user: Any, login: Any) -> None:
        """Xóa mềm mã QR đồng thời xóa mềm cả ảnh đính kèm (Attachment) trong Thư viện."""
        grant(user, P.DELETE)
        qr = create_test_qr(user, name="Xóa QR")
        image = Attachment.objects.get(pk=qr.image_id)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{qr.pk}")
        assert res.status_code == 204

        qr.refresh_from_db()
        assert qr.deleted_at is not None
        assert qr.deleted_by_id == user.pk

        image.refresh_from_db()
        assert image.deleted_at is not None

    def test_delete_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xóa mã QR của người khác (trả về 404 NOT_FOUND bảo mật)."""
        grant(user, P.DELETE)
        other_user = UserFactory()
        other_qr = create_test_qr(other_user, name="QR Người Khác")

        api = login(user)
        res = api.delete(f"{BASE_URL}/{other_qr.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

        other_qr.refresh_from_db()
        assert other_qr.deleted_at is None

    def test_delete_manage_all_can_delete_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì xóa được QR của người khác."""
        grant(user, P.DELETE, P.MANAGE_ALL)
        other_user = UserFactory()
        other_qr = create_test_qr(other_user, name="QR Người Khác")

        api = login(user)
        res = api.delete(f"{BASE_URL}/{other_qr.pk}")
        assert res.status_code == 204

        other_qr.refresh_from_db()
        assert other_qr.deleted_at is not None

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.delete bị 403."""
        qr = create_test_qr(user, name="QR")
        api = login(user)
        res = api.delete(f"{BASE_URL}/{qr.pk}")
        self.assert_forbidden(res)
