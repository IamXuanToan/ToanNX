"""Khoảng ngày lấy giao dịch thủ công."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SepayRangeValidateSerializer(CoreValidateSerializer):
    """Tối đa 92 ngày (service kiểm)."""

    date_from = serializers.DateField(help_text="Từ ngày.")
    date_to = serializers.DateField(help_text="Đến ngày.")
