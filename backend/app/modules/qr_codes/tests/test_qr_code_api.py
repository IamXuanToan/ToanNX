"""Mã QR: payload VietQR, ảnh trong Thư viện, sửa giữ id ảnh, xem trước, quyền owner."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.utils.text import to_ascii
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.attachment.models.attachment import Attachment
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.qr_codes.permissions.qr_codes_permission import QrCodesPermission as P
from app.modules.qr_codes.utils.vietqr_payload import build_vietqr_payload, crc16_ccitt

pytestmark = pytest.mark.django_db
BASE = "/api/v1/qr_codes/codes"
BANK = {
    "bank_bin": "970436",
    "account_number": "0123456789",
    "account_name": "Nguyễn Xuân Toàn",
    "amount": 50000,
    "message": "Ủng hộ ToanNX",
}


def test_crc_and_payload_vector() -> None:
    assert crc16_ccitt("123456789") == "29B1"  # vector chuẩn CRC-16/CCITT-FALSE
    payload = build_vietqr_payload("970436", "0123456789", 50000, "ung ho")
    assert payload.startswith("000201010212")
    assert "0010A000000727" in payload and "0006970436" in payload and "QRIBFTTA" in payload
    assert "5405500005303704" not in payload  # thứ tự đúng: 53 trước 54
    assert "5303704" in payload and "540550000" in payload and "5802VN" in payload
    assert payload[-8:-4] == "6304" and payload[-4:] == crc16_ccitt(payload[:-4])
    assert build_vietqr_payload("970436", "0123456789", None, "")[10:12] == "11"
    assert to_ascii("Đồng Tháp") == "Dong Thap"


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
