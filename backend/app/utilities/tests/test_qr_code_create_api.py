"""Kiểm thử endpoint tạo mã QR: POST /api/v1/utilities/qr-codes."""

from typing import Any

import pytest
from qr_pay import decode

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.services.attachment_service import AttachmentService
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import BANK_SAMPLE, make_logo_png

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/qr-codes"


class TestQrCodeCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/qr-codes."""

    def test_create_success_bank_transfer(self, user: Any, login: Any) -> None:
        """Tạo mã QR chuyển khoản VietQR chuẩn hóa tên hoa, không dấu."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {
            "name": "Ủng hộ dự án",
            "qr_type": "BANK_TRANSFER",
            "content": BANK_SAMPLE,
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Ủng hộ dự án"
        assert data["qr_type"] == "BANK_TRANSFER"
        assert data["content"]["account_name"] == "NGUYEN XUAN TOAN"
        assert data["content"]["message"] == "Ung ho ToanNX"
        assert decode(data["payload"])["transaction_amount"] == "50000"
        assert data["design"]["size"] == 512

        # Kiểm tra Attachment ảnh được tạo đúng
        image = Attachment.objects.get(pk=data["image"]["id"])
        assert image.created_by_id == user.pk
        assert image.content_type == "image/png"

    def test_create_success_url_min_data(self, user: Any, login: Any) -> None:
        """Tạo mã QR liên kết với dữ liệu tối thiểu."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {
            "name": "Trang Web",
            "qr_type": "URL",
            "content": {"url": "https://toannx.com"},
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Trang Web"
        assert data["qr_type"] == "URL"
        assert data["payload"] == "https://toannx.com"
        assert data["logo"] is None

    def test_create_success_with_logo(self, user: Any, login: Any) -> None:
        """Tạo mã QR có ảnh logo ở tâm."""
        grant(user, P.CREATE, AttachmentPermission.FILE_READ)
        logo = AttachmentService().create_generated(user, make_logo_png(), "logo.png")
        api = login(user)

        payload = {
            "name": "QR Có Logo",
            "qr_type": "URL",
            "content": {"url": "https://toannx.com"},
            "design": {"error_correction": "L"},
            "logo_id": str(logo.pk),
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["logo"]["id"] == str(logo.pk)
        # Tự nâng mức sửa lỗi lên H khi có logo
        assert data["design"]["error_correction"] == "H"

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu name, qr_type hoặc content."""
        grant(user, P.CREATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "name" in error["details"]
        assert "qr_type" in error["details"]
        assert "content" in error["details"]

    def test_create_validation_invalid_bank_bin_and_message(self, user: Any, login: Any) -> None:
        """Validate lỗi ngân hàng không hợp lệ hoặc thông điệp quá 25 ký tự."""
        grant(user, P.CREATE)
        api = login(user)

        # BIN không tồn tại
        bad_bin = {**BANK_SAMPLE, "bank_bin": "000000"}
        res1 = api.post(URL, {"name": "Test", "qr_type": "BANK_TRANSFER", "content": bad_bin}, format="json")
        self.assert_error(res1, 400, "VALIDATION_ERROR")

        # Thông điệp quá dài
        long_msg = {**BANK_SAMPLE, "message": "x" * 26}
        res2 = api.post(URL, {"name": "Test", "qr_type": "BANK_TRANSFER", "content": long_msg}, format="json")
        self.assert_error(res2, 400, "VALIDATION_ERROR")

    def test_create_validation_invalid_url_protocol(self, user: Any, login: Any) -> None:
        """Validate lỗi URL không an toàn."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {"name": "Bad", "qr_type": "URL", "content": {"url": "javascript:alert(1)"}}
        res = api.post(URL, payload, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_create_unowned_logo_rejected_404(self, user: Any, login: Any) -> None:
        """Không thể dùng logo thuộc sở hữu của người khác (trả về 404 NOT_FOUND)."""
        grant(user, P.CREATE, AttachmentPermission.FILE_READ)
        other_user = UserFactory()
        other_logo = AttachmentService().create_generated(other_user, make_logo_png(), "other.png")

        api = login(user)
        payload = {
            "name": "Hack Logo",
            "qr_type": "TEXT",
            "content": {"text": "hello"},
            "logo_id": str(other_logo.pk),
        }
        res = api.post(URL, payload, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"name": "QR", "qr_type": "TEXT", "content": {"text": "a"}}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.create bị 403."""
        api = login(user)
        res = api.post(URL, {"name": "QR", "qr_type": "TEXT", "content": {"text": "a"}}, format="json")
        self.assert_forbidden(res)
