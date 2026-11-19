"""Helper cho kiểm thử qr_codes."""

import io
from typing import Any
from PIL import Image

from app.modules.qr_codes.models.qr_code import QrCode
from app.modules.qr_codes.services.qr_code_service import QrCodeService

BANK_SAMPLE = {
    "bank_bin": "970436",
    "account_number": "0123456789",
    "account_name": "Nguyễn Xuân Toàn",
    "amount": 50000,
    "message": "Ủng hộ ToanNX",
}


def make_logo_png() -> bytes:
    """Tạo byte ảnh PNG đỏ 64x64 để test overlay tâm mã QR."""
    output = io.BytesIO()
    Image.new("RGB", (64, 64), "#FF0000").save(output, format="PNG")
    return output.getvalue()


def create_test_qr(
    owner: Any,
    name: str = "QR Code",
    qr_type: str = "TEXT",
    content: dict[str, Any] | None = None,
    design: dict[str, Any] | None = None,
    logo_id: str | None = None,
) -> QrCode:
    """Tạo QR code hợp lệ qua QrCodeService có sẵn design mặc định."""
    svc = QrCodeService()
    default_design = {"size": 512, "margin": 4, "error_correction": "M"}
    payload = {
        "name": name,
        "qr_type": qr_type,
        "content": content or {"text": "sample text"},
        "design": {**default_design, **(design or {})},
    }
    if logo_id:
        payload["logo_id"] = logo_id
    return svc.create(owner, payload)
