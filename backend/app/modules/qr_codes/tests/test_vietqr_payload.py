"""Kiểm thử tính toán payload VietQR và khả năng đọc mã QR với zxingcpp."""

import io

import pytest
import zxingcpp
from PIL import Image
from qr_pay import decode

from app.core.utils.text import to_ascii
from app.modules.qr_codes.tests.helpers.qr_test_helper import make_logo_png
from app.modules.qr_codes.utils.qr_image_renderer import render_png
from app.modules.qr_codes.utils.vietqr_payload import build_vietqr_payload


def test_vietqr_payload_can_be_decoded_with_verified_crc() -> None:
    """Tạo chuỗi VietQR chuẩn EMVCo và giải mã kiểm tra CRC."""
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
    png = render_png(payload, {"size": 512, "margin": 4, "error_correction": "H"}, make_logo_png())
    with Image.open(io.BytesIO(png)) as qr_image:
        decoded = zxingcpp.read_barcode(qr_image)
    assert decoded is not None and decoded.text == payload
