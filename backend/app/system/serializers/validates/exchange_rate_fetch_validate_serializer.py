"""Lấy lại tỷ giá từ API cho một ngày."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ExchangeRateFetchValidateSerializer(CoreValidateSerializer):
    """Tiền tệ + ngày."""

    currency_id = serializers.UUIDField(help_text="Ngoại tệ.")
    date = serializers.DateField(help_text="Ngày.")
