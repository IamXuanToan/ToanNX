"""Nhập giao dịch đã chọn ở màn xem trước."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SepayImportValidateSerializer(CoreValidateSerializer):
    """Cùng khoảng ngày lúc xem trước + id SePay đã tích."""

    date_from = serializers.DateField(help_text="Từ ngày.")
    date_to = serializers.DateField(help_text="Đến ngày.")
    ids = serializers.ListField(
        child=serializers.CharField(max_length=64), allow_empty=False, help_text="Id SePay đã chọn."
    )
