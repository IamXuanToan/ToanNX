"""Response một dòng xem trước lấy thủ công."""

from typing import Any

from rest_framework import serializers


class SepayPreviewRowResponseSerializer(serializers.Serializer[Any]):
    """NEW / EXISTS / CHANGED / INVALID + nền tảng, khấu trừ dự kiến, bản đang lưu."""

    sepay_id = serializers.CharField(help_text="Id SePay.")
    status = serializers.CharField(help_text="NEW / EXISTS / CHANGED / INVALID.")
    received_at = serializers.DateTimeField(help_text="Thời điểm.")
    amount = serializers.DecimalField(max_digits=20, decimal_places=0, allow_null=True, help_text="VNĐ.")
    content = serializers.CharField(allow_blank=True, help_text="Nội dung.")
    reference_code = serializers.CharField(allow_blank=True, help_text="Mã giao dịch.")
    platform_id = serializers.UUIDField(allow_null=True, help_text="Nền tảng dự kiến.")
    platform_name = serializers.CharField(allow_blank=True, help_text="Tên nền tảng.")
    tax_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, allow_null=True, help_text="% dự kiến."
    )
    tax_amount = serializers.DecimalField(
        max_digits=20, decimal_places=0, allow_null=True, help_text="Thuế dự kiến."
    )
    income_id = serializers.UUIDField(allow_null=True, help_text="Giao dịch đang lưu.")
    existing_amount = serializers.DecimalField(
        max_digits=20, decimal_places=0, allow_null=True, help_text="Số tiền đang lưu."
    )
    existing_received_at = serializers.DateTimeField(allow_null=True, help_text="Thời điểm đang lưu.")
    existing_content = serializers.CharField(allow_blank=True, help_text="Nội dung đang lưu.")
