"""Kiểm thử endpoint xem trước mã QR: POST /api/v1/utilities/qr-codes/preview."""

import base64
from typing import Any

import pytest
from qr_pay import decode

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.services.attachment_service import AttachmentService
from app.system.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import BANK_SAMPLE, make_logo_png

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/qr-codes/preview"


class TestQrCodePreviewApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/qr-codes/preview."""

    def test_preview_text_success(self, user: Any, login: Any) -> None:
        """Xem trước mã QR văn bản trả về SVG base64 hợp lệ."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {"qr_type": "TEXT", "content": {"text": "Xin chào"}}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["payload"] == "Xin chào"
        assert data["svg"].startswith("data:image/svg+xml;base64,")

    def test_preview_bank_success(self, user: Any, login: Any) -> None:
        """Xem trước mã QR VietQR không chỉ định số tiền (static QR)."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {"qr_type": "BANK_TRANSFER", "content": {**BANK_SAMPLE, "amount": None}}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        bank_data = decode(data["payload"])
        assert bank_data["point_of_initiation_method"] == "11"
        assert bank_data["consumer_id"] == BANK_SAMPLE["account_number"]
        assert bank_data["purpose_of_transaction"] == "Ung ho ToanNX"
        assert data["svg"].startswith("data:image/svg+xml;base64,")

    def test_preview_with_logo(self, user: Any, login: Any) -> None:
        """Xem trước mã QR có logo nhúng SVG data URI."""
        grant(user, P.CREATE, AttachmentPermission.FILE_READ)
        logo = AttachmentService().create_generated(user, make_logo_png(), "logo.png")
        api = login(user)

        payload = {
            "qr_type": "URL",
            "content": {"url": "https://toannx.com"},
            "design": {"error_correction": "L"},
            "logo_id": str(logo.pk),
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        svg = base64.b64decode(data["svg"].split(",", 1)[1])
        assert b"<image " in svg and b"data:image/png;base64," in svg

    def test_preview_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"qr_type": "TEXT", "content": {"text": "a"}}, format="json")
        self.assert_unauthorized(res)

    def test_preview_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.create bị 403."""
        api = login(user)
        res = api.post(URL, {"qr_type": "TEXT", "content": {"text": "a"}}, format="json")
        self.assert_forbidden(res)
