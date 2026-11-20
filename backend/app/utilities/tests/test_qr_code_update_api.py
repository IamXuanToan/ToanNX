"""Kiểm thử endpoint cập nhật mã QR: PATCH /api/v1/utilities/qr-codes/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.services.attachment_service import AttachmentService
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import create_test_qr, make_logo_png

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/qr-codes"


class TestQrCodeUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/utilities/qr-codes/{id}."""

    def test_update_design_keeps_image_id_and_updates_checksum(self, user: Any, login: Any) -> None:
        """Cập nhật kiểu dáng (design) vẽ lại ảnh, cập nhật checksum nhưng giữ nguyên image_id."""
        grant(user, P.UPDATE)
        qr = create_test_qr(user, name="Gốc")
        old_image_id = qr.image_id
        old_image = Attachment.objects.get(pk=old_image_id)
        old_checksum = old_image.checksum

        api = login(user)
        payload = {"design": {"foreground": "#ff0000"}}
        res = api.patch(f"{BASE_URL}/{qr.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        # Giữ nguyên ID ảnh
        assert data["image"]["id"] == str(old_image_id)
        assert data["design"]["foreground"] == "#FF0000"

        # Checksum nội dung file ảnh đã đổi
        old_image.refresh_from_db()
        assert old_image.checksum != old_checksum

    def test_update_remove_logo(self, user: Any, login: Any) -> None:
        """Gỡ logo bằng cách truyền logo_id: None."""
        grant(user, P.UPDATE, AttachmentPermission.FILE_READ)
        logo = AttachmentService().create_generated(user, make_logo_png(), "logo.png")
        qr = create_test_qr(
            user,
            name="QR Logo",
            logo_id=str(logo.pk),
        )
        api = login(user)

        res = api.patch(f"{BASE_URL}/{qr.pk}", {"logo_id": None}, format="json")
        data = self.assert_success(res, 200)
        assert data["logo"] is None

    def test_update_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể sửa QR của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.UPDATE)
        other_user = UserFactory()
        other_qr = create_test_qr(other_user, name="QR Người Khác")

        api = login(user)
        res = api.patch(f"{BASE_URL}/{other_qr.pk}", {"name": "Hack"}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_update_manage_all_can_update_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì sửa được QR của người khác."""
        grant(user, P.UPDATE, P.MANAGE_ALL)
        other_user = UserFactory()
        other_qr = create_test_qr(other_user, name="QR Người Khác")

        api = login(user)
        res = api.patch(f"{BASE_URL}/{other_qr.pk}", {"name": "Admin Đổi Tên"}, format="json")
        data = self.assert_success(res, 200)
        assert data["name"] == "Admin Đổi Tên"

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(f"{BASE_URL}/00000000-0000-0000-0000-000000000000", {}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.update bị 403."""
        qr = create_test_qr(user, name="QR")
        api = login(user)
        res = api.patch(f"{BASE_URL}/{qr.pk}", {"name": "Đổi Tên"}, format="json")
        self.assert_forbidden(res)
