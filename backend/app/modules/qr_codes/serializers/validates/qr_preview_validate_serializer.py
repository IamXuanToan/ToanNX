"""Validate POST /qr_codes/preview (không ghi DB)."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.qr_codes.models.qr_code import QrCode
from app.modules.qr_codes.utils.qr_content import validate_qr_content


class QrPreviewValidateSerializer(CoreValidateSerializer):
    """Loại, dữ liệu, kiểu dáng để xem trước."""

    qr_type = serializers.ChoiceField(choices=QrCode.Type.choices, help_text="BANK_TRANSFER, URL, TEXT.")
    content = serializers.JSONField(help_text="Dữ liệu theo loại.")
    design = serializers.JSONField(required=False, help_text="Kiểu dáng.")
    logo_id = serializers.UUIDField(required=False, allow_null=True, help_text="Id ảnh logo trong Thư viện.")

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Kiểm `content`/`design` theo loại."""
        attrs["content"], attrs["design"] = validate_qr_content(
            attrs["qr_type"], attrs["content"], attrs.get("design")
        )
        return attrs
