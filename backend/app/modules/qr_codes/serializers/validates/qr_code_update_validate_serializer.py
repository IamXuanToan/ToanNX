"""Validate PATCH /qr_codes/codes/{id} (đổi loại thì gửi kèm `data` mới; service kiểm lại theo loại)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.qr_codes.models.qr_code import QrCode


class QrCodeUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi trường tùy chọn; service gộp với bản ghi hiện tại rồi kiểm theo loại."""

    name = serializers.CharField(required=False, max_length=150, help_text="Tên mã QR.")
    qr_type = serializers.ChoiceField(required=False, choices=QrCode.Type.choices, help_text="Loại.")
    content = serializers.JSONField(required=False, help_text="Dữ liệu theo loại.")
    design = serializers.JSONField(required=False, help_text="Kiểu dáng.")
    logo_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Id ảnh logo; null để bỏ logo."
    )
