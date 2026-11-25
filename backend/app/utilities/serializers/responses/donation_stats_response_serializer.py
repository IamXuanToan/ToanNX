"""Serializer response cho thống kê Dashboard quyên góp."""

from rest_framework import serializers


class DonationStatsResponseSerializer(serializers.Serializer):
    """Thống kê tổng hợp quyên góp."""

    total_amount = serializers.IntegerField(help_text="Tổng số tiền ủng hộ (VNĐ).")
    total_count = serializers.IntegerField(help_text="Tổng số lượt ủng hộ.")
    censored_count = serializers.IntegerField(help_text="Số lượt bị kiểm duyệt từ ngữ xấu.")
    hidden_count = serializers.IntegerField(help_text="Số lượt chủ trang ẩn bình luận.")
    by_gift = serializers.ListField(child=serializers.DictField(), help_text="Thống kê cơ cấu quà tặng.")
    active_tier_counts = serializers.DictField(help_text="Số lượng người đang trên từng bảng vinh danh.")
    daily_trend = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
        help_text="Thống kê biến động ủng hộ theo ngày.",
    )
