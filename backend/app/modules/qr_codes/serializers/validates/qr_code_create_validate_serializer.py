"""Validate POST /qr_codes/codes."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.qr_codes.models.qr_code import QrCode
from app.modules.qr_codes.utils.qr_content import validate_qr_content


class QrCodeCreateValidateSerializer(CoreValidateSerializer):
    """Tên, loại, dữ liệu theo loại, kiểu dáng (tùy chọn)."""

    name = serializers.CharField(max_length=150, help_text="Tên mã QR.")
    qr_type = serializers.ChoiceField(choices=QrCode.Type.choices, help_text="BANK_TRANSFER, URL, TEXT.")
    content = serializers.JSONField(help_text="Dữ liệu theo loại (xem schema của từng loại).")
    design = serializers.JSONField(required=False, help_text="Kiểu dáng; trống = mặc định.")

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Kiểm `content`/`design` theo loại."""
        attrs["content"], attrs["design"] = validate_qr_content(
            attrs["qr_type"], attrs["content"], attrs.get("design")
        )
        return attrs
