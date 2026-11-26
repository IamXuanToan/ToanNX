"""Validate cập nhật Cài đặt Digest, Cảnh báo cá nhân & Chat Telegram được phép."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class WorkspaceSettingUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PUT/PATCH `/workspace/settings` (người dùng chỉ cấu hình Digest & Múi giờ cá nhân)."""

    timezone = serializers.CharField(
        max_length=64, required=False, help_text="Múi giờ chuẩn IANA (VD: Asia/Ho_Chi_Minh)."
    )
    daily_digest_enabled = serializers.BooleanField(
        required=False, help_text="Bật gửi bản tin tóm tắt hàng ngày."
    )
    digest_time_slots = serializers.ListField(
        child=serializers.CharField(max_length=5),
        required=False,
        help_text="Khung giờ gửi Digest định dạng HH:MM.",
    )
    digest_sections = serializers.ListField(
        child=serializers.CharField(max_length=32),
        required=False,
        help_text="Các mục hiển thị trong Digest (`reminders`, `warranty`, `subscriptions`, `finance`).",
    )
    warranty_alert_days = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=365),
        required=False,
        help_text="Mốc ngày nhắc trước hạn bảo hành (VD: [30, 7, 1]).",
    )
    subscription_default_alert_days = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=365),
        required=False,
        help_text="Mốc ngày nhắc mặc định cho dịch vụ định kỳ.",
    )
    telegram_allowed_chat_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Danh sách UUID của `system.TelegramChat` nhận bản tin/tương tác.",
    )
