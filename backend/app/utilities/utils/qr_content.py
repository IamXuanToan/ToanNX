"""Kiểm dữ liệu theo loại và dựng payload của mã QR (dùng chung cho tạo, sửa, xem trước)."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.utilities.models.qr_code import QrCode
from app.utilities.serializers.validates.qr_bank_transfer_data_validate_serializer import (
    QrBankTransferDataValidateSerializer,
)
from app.utilities.serializers.validates.qr_style_validate_serializer import QrStyleValidateSerializer
from app.utilities.serializers.validates.qr_text_data_validate_serializer import (
    QrTextDataValidateSerializer,
)
from app.utilities.serializers.validates.qr_url_data_validate_serializer import (
    QrUrlDataValidateSerializer,
)
from app.utilities.utils.vietqr_payload import build_vietqr_payload

DATA_SERIALIZERS: dict[str, type[CoreValidateSerializer]] = {
    QrCode.Type.BANK_TRANSFER: QrBankTransferDataValidateSerializer,
    QrCode.Type.URL: QrUrlDataValidateSerializer,
    QrCode.Type.TEXT: QrTextDataValidateSerializer,
}


def _validate(serializer_class: type[CoreValidateSerializer], value: Any, field: str) -> dict[str, Any]:
    """Validate một khối JSON; lỗi gắn dưới tên khối (`content.account_number`...)."""
    try:
        return serializer_class.validate_data(value if isinstance(value, dict) else {})
    except serializers.ValidationError as exc:
        raise serializers.ValidationError({field: exc.detail}) from exc


def validate_qr_content(qr_type: str, data: Any, style: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    """Validate nội dung theo loại và kiểu dáng.

    Args:
        qr_type: Loại mã QR.
        data: Dữ liệu thô.
        style: Kiểu dáng thô (None = mặc định).

    Returns:
        (data đã chuẩn hóa, style đã gộp mặc định).
    """
    return _validate(DATA_SERIALIZERS[qr_type], data, "content"), _validate(
        QrStyleValidateSerializer, style or {}, "style"
    )


def build_payload(qr_type: str, data: dict[str, Any]) -> str:
    """Chuỗi mã hóa vào QR.

    Args:
        qr_type: Loại.
        data: Dữ liệu đã validate.

    Returns:
        Payload.
    """
    if qr_type == QrCode.Type.BANK_TRANSFER:
        return build_vietqr_payload(data["bank_bin"], data["account_number"], data["amount"], data["message"])
    if qr_type == QrCode.Type.URL:
        return str(data["url"])
    return str(data["text"])
