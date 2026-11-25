"""Serializer response cho Bảng Vinh danh công khai trên trang Donate."""

from rest_framework import serializers


class DonationPublicLeaderboardResponseSerializer(serializers.Serializer):
    """Một mục trên Bảng Vinh danh (Đồng, Bạc, Vàng)."""

    id = serializers.CharField(help_text="ID giao dịch.")
    donor_title = serializers.CharField(help_text="Danh xưng tri ân.")
    amount = serializers.IntegerField(allow_null=True, help_text="Số tiền ủng hộ (None nếu ẩn số tiền).")
    hide_amount = serializers.BooleanField(default=False, help_text="Cờ ẩn số tiền.")
    gift_label = serializers.CharField(help_text="Món quà quy đổi.")
    tier = serializers.CharField(help_text="Bậc vinh danh (BRONZE, SILVER, GOLD, DIAMOND).")
    tier_expires_at = serializers.DateTimeField(allow_null=True, help_text="Thời điểm hết hạn đếm ngược.")
    message = serializers.CharField(help_text="Lời nhắn.")
    received_at = serializers.DateTimeField(help_text="Thời gian nhận tiền.")
