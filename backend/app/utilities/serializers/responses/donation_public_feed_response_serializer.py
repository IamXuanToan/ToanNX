"""Serializer response cho Feed ủng hộ công khai trên trang Donate."""

from rest_framework import serializers


class DonationPublicFeedResponseSerializer(serializers.Serializer):
    """Một dòng tin ủng hộ trên trang công khai."""

    id = serializers.CharField(help_text="ID giao dịch.")
    donor_title = serializers.CharField(help_text="Danh xưng tri ân (Anh chị em đẹp zai...).")
    amount = serializers.IntegerField(
        allow_null=True,
        help_text="Số tiền ủng hộ (ẩn nếu QR bật hide_amount).",
    )
    hide_amount = serializers.BooleanField(help_text="Cờ ẩn số tiền.")
    gift_type = serializers.CharField(help_text="Mã loại quà tặng.")
    gift_label = serializers.CharField(help_text="Nhãn quà tặng (Ly cà phê, Gói mì tôm...).")
    tier = serializers.CharField(help_text="Cấp bậc vinh danh.")
    tier_expires_at = serializers.DateTimeField(allow_null=True, help_text="Thời điểm hết hạn vinh danh.")
    message = serializers.CharField(help_text="Lời nhắn ủng hộ.")
    received_at = serializers.DateTimeField(help_text="Thời gian nhận tiền.")
