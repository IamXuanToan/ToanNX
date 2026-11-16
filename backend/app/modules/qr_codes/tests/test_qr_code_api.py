"""Mã QR: payload VietQR, ảnh trong Thư viện, sửa giữ id ảnh, xem trước, quyền owner."""

import base64
import io
from typing import Any

import pytest
import zxingcpp
from PIL import Image
from qr_pay import decode

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.utils.text import to_ascii
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.qr_codes.permissions.qr_codes_permission import QrCodesPermission as P
from app.modules.qr_codes.utils.qr_image_renderer import render_png
from app.modules.qr_codes.utils.vietqr_payload import build_vietqr_payload

pytestmark = pytest.mark.django_db
BASE = "/api/v1/qr_codes/codes"
BANK = {
    "bank_bin": "970436",
    "account_number": "0123456789",
    "account_name": "Nguyễn Xuân Toàn",
    "amount": 50000,
    "message": "Ủng hộ ToanNX",
}


def _logo_png() -> bytes:
    """Ảnh logo đỏ để kiểm tra overlay ở tâm mã QR."""
    output = io.BytesIO()
    Image.new("RGB", (64, 64), "#FF0000").save(output, format="PNG")
    return output.getvalue()


def test_vietqr_payload_can_be_decoded_with_verified_crc() -> None:
    payload = build_vietqr_payload("970436", "0123456789", 50000, "ung ho")
    assert payload == (
        "00020101021238540010A00000072701240006970436011001234567890208QRIBFTTA"
        "53037045405500005802VN62100806ung ho63040AA6"
    )
    parsed = decode(payload)
    assert parsed["bin_id"] == "970436"
    assert parsed["consumer_id"] == "0123456789"
    assert parsed["service_code"] == "QRIBFTTA"
    assert parsed["point_of_initiation_method"] == "12"
    assert parsed["transaction_amount"] == "50000"
    assert parsed["purpose_of_transaction"] == "ung ho"
    assert parsed["transaction_currency"] == "704"
    assert parsed["country_code"] == "VN"

    static = decode(build_vietqr_payload("970436", "0123456789", None, ""))
    assert static["point_of_initiation_method"] == "11"
    assert static["transaction_amount"] is None
    assert to_ascii("Đồng Tháp") == "Dong Thap"


@pytest.mark.parametrize(
    "payload",
    [
        "https://example.com/qr",
        build_vietqr_payload("970436", "0123456789", 50000, "ung ho"),
    ],
)
def test_logo_qr_is_scannable(payload: str) -> None:
    """Decoder độc lập đọc lại đúng nội dung từ ảnh có logo."""
    png = render_png(payload, {"size": 512, "margin": 4, "error_correction": "H"}, _logo_png())
    with Image.open(io.BytesIO(png)) as qr_image:
        decoded = zxingcpp.read_barcode(qr_image)
    assert decoded is not None and decoded.text == payload


class TestQrCodeApi(BaseApiTestCase):
    """CRUD qua API."""

    def test_create_update_keeps_image_id(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ, P.UPDATE, P.DELETE)
        api = login(user)
        created = self.assert_success(
            api.post(BASE, {"name": "Ủng hộ", "qr_type": "BANK_TRANSFER", "content": BANK}, format="json"),
            201,
        )
        assert created["content"]["account_name"] == "NGUYEN XUAN TOAN"
        assert created["content"]["message"] == "Ung ho ToanNX"
        assert decode(created["payload"])["transaction_amount"] == "50000"
        assert created["design"]["size"] == 512
        image = Attachment.objects.get(pk=created["image"]["id"])
        assert image.created_by_id == user.pk and image.content_type == "image/png"
        old_checksum = image.checksum

        updated = self.assert_success(
            api.patch(f"{BASE}/{created['id']}", {"design": {"foreground": "#ff0000"}}, format="json")
        )
        assert updated["image"]["id"] == created["image"]["id"]
        image.refresh_from_db()
        assert image.checksum != old_checksum
        assert updated["design"]["foreground"] == "#FF0000"

        history = self.assert_success(api.get(f"{BASE}/{created['id']}/history"))
        assert [entry["action"] for entry in history] == ["UPDATE", "CREATE"]

        assert api.delete(f"{BASE}/{created['id']}").status_code == 204
        image.refresh_from_db()
        assert image.deleted_at is not None

    def test_validation_by_type(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE)
        api = login(user)
        bad_bank = {**BANK, "bank_bin": "000000"}
        error = self.assert_error(
            api.post(BASE, {"name": "x", "qr_type": "BANK_TRANSFER", "content": bad_bank}, format="json"), 400
        )
        assert "content" in error["details"]
        long_message = {**BANK, "message": "x" * 26}
        self.assert_error(
            api.post(BASE, {"name": "x", "qr_type": "BANK_TRANSFER", "content": long_message}, format="json"),
            400,
        )
        self.assert_error(
            api.post(
                BASE,
                {"name": "x", "qr_type": "URL", "content": {"url": "javascript:alert(1)"}},
                format="json",
            ),
            400,
        )
        self.assert_success(
            api.post(
                BASE,
                {"name": "Web", "qr_type": "URL", "content": {"url": "https://toannx.com"}},
                format="json",
            ),
            201,
        )

    def test_logo_preview_create_and_remove_keeps_image_id(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ, P.UPDATE, AttachmentPermission.FILE_READ)
        logo = AttachmentService().create_generated(user, _logo_png(), "logo.png")
        api = login(user)
        body = {
            "name": "Có logo",
            "qr_type": "URL",
            "content": {"url": "https://toannx.com"},
            "design": {"error_correction": "L"},
            "logo_id": str(logo.pk),
        }
        preview = self.assert_success(
            api.post(
                "/api/v1/qr_codes/preview",
                {key: value for key, value in body.items() if key != "name"},
                format="json",
            )
        )
        svg = base64.b64decode(preview["svg"].split(",", 1)[1])
        assert b"<image " in svg and b"data:image/png;base64," in svg

        created = self.assert_success(api.post(BASE, body, format="json"), 201)
        assert created["logo"]["id"] == str(logo.pk)
        assert created["design"]["error_correction"] == "H"
        assert created["design"]["margin"] == 4
        image = Attachment.objects.get(pk=created["image"]["id"])
        with image.file.open("rb") as source, Image.open(source) as qr_image:
            assert qr_image.convert("RGB").getpixel((qr_image.width // 2, qr_image.height // 2)) == (
                255,
                0,
                0,
            )
        old_checksum = image.checksum

        updated = self.assert_success(api.patch(f"{BASE}/{created['id']}", {"logo_id": None}, format="json"))
        assert updated["image"]["id"] == created["image"]["id"]
        assert updated["logo"] is None
        image.refresh_from_db()
        assert image.checksum != old_checksum

    def test_logo_must_be_owned_readable_raster_image(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, AttachmentPermission.FILE_READ)
        other = UserFactory()
        other_logo = AttachmentService().create_generated(other, _logo_png(), "other-logo.png")
        body = {
            "name": "Không có quyền logo",
            "qr_type": "TEXT",
            "content": {"text": "Xin chào"},
            "logo_id": str(other_logo.pk),
        }
        self.assert_error(login(user).post(BASE, body, format="json"), 404, "NOT_FOUND")

        svg = (
            b'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">'
            b'<rect width="32" height="32"/></svg>'
        )
        svg_logo = AttachmentService().create_generated(user, svg, "logo.svg")
        error = self.assert_error(
            login(user).post(BASE, {**body, "logo_id": str(svg_logo.pk)}, format="json"), 400
        )
        assert "logo_id" in error["details"]

    def test_preview_and_banks(self, user: Any, login: Any) -> None:
        api = login(user)
        self.assert_forbidden(api.post("/api/v1/qr_codes/preview", {}, format="json"))
        banks = self.assert_success(api.get("/api/v1/qr_codes/banks"))
        assert any(bank["bin"] == "970436" for bank in banks)
        grant(user, P.CREATE)
        preview = self.assert_success(
            api.post(
                "/api/v1/qr_codes/preview",
                {"qr_type": "TEXT", "content": {"text": "Xin chào"}},
                format="json",
            )
        )
        assert preview["payload"] == "Xin chào"
        assert preview["svg"].startswith("data:image/svg+xml;base64,")

        bank_preview = self.assert_success(
            api.post(
                "/api/v1/qr_codes/preview",
                {"qr_type": "BANK_TRANSFER", "content": {**BANK, "amount": None}},
                format="json",
            )
        )
        bank_data = decode(bank_preview["payload"])
        assert bank_data["point_of_initiation_method"] == "11"
        assert bank_data["consumer_id"] == BANK["account_number"]
        assert bank_data["purpose_of_transaction"] == "Ung ho ToanNX"
        assert bank_preview["svg"].startswith("data:image/svg+xml;base64,")

    def test_owner_scope(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ)
        other = UserFactory()
        grant(other, P.READ)
        created = self.assert_success(
            login(user).post(
                BASE, {"name": "Mine", "qr_type": "TEXT", "content": {"text": "a"}}, format="json"
            ),
            201,
        )
        other_api = login(other)
        self.assert_error(other_api.get(f"{BASE}/{created['id']}"), 404, "NOT_FOUND")
        assert self.assert_success(other_api.get(BASE)) == []
