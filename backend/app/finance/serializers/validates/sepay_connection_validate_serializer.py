"""Lưu kết nối SePay."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SepayConnectionValidateSerializer(CoreValidateSerializer):
    """Token chỉ ghi (kiểm bằng `/v2/bank-accounts` trước khi lưu); bật/tắt."""

    token = serializers.CharField(
        max_length=500, required=False, allow_blank=True, write_only=True, help_text="Token API SePay."
    )
    is_active = serializers.BooleanField(required=False, help_text="Đang bật.")
