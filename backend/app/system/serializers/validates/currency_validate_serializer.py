"""Tạo tiền tệ."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

MAX_DECIMAL_PLACES = 4


class CurrencyValidateSerializer(CoreValidateSerializer):
    """Mã ISO 4217 3 chữ in hoa."""

    code = serializers.RegexField(r"^[A-Z]{3}$", help_text="Mã ISO 4217, ví dụ USD.")
    name = serializers.CharField(max_length=100, help_text="Tên.")
    symbol = serializers.CharField(max_length=10, help_text="Ký hiệu.")
    decimal_places = serializers.IntegerField(min_value=0, max_value=MAX_DECIMAL_PLACES, help_text="Số lẻ.")
    is_active = serializers.BooleanField(required=False, default=True, help_text="Đang dùng.")
    position = serializers.IntegerField(required=False, min_value=0, default=0, help_text="Thứ tự.")
