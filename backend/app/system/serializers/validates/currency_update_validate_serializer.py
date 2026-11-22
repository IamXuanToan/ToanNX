"""Sửa tiền tệ."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

MAX_DECIMAL_PLACES = 4


class CurrencyUpdateValidateSerializer(CoreValidateSerializer):
    """Mọi field tùy chọn; tiền tệ gốc chỉ đổi tên/ký hiệu/thứ tự (service kiểm)."""

    code = serializers.RegexField(r"^[A-Z]{3}$", required=False, help_text="Mã ISO 4217.")
    name = serializers.CharField(max_length=100, required=False, help_text="Tên.")
    symbol = serializers.CharField(max_length=10, required=False, help_text="Ký hiệu.")
    decimal_places = serializers.IntegerField(
        min_value=0, max_value=MAX_DECIMAL_PLACES, required=False, help_text="Số lẻ."
    )
    is_active = serializers.BooleanField(required=False, help_text="Đang dùng.")
    position = serializers.IntegerField(required=False, min_value=0, help_text="Thứ tự.")
