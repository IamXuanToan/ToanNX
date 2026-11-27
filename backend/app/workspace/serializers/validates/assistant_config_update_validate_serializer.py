"""Validate cập nhật cấu hình Chatbot AI dùng chung toàn hệ thống (Admin)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.assistant_launcher_size import AssistantLauncherSize
from app.workspace.constants.group_tool_policy import GroupToolPolicy


class AssistantConfigUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PUT/PATCH `/workspace/assistant/config` (chỉ Admin)."""

    assistant_name = serializers.CharField(
        max_length=80,
        required=False,
        allow_blank=True,
        help_text="Tên hiển thị của Chatbot AI (để trống dùng tên mặc định).",
    )
    assistant_avatar_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="ID ảnh công khai (upload qua /attachments) làm avatar Chatbot AI; null để gỡ.",
    )
    launcher_size = serializers.ChoiceField(
        choices=[(item.value, item.value) for item in AssistantLauncherSize],
        required=False,
        help_text="Kích thước nút tròn Chatbot AI nổi trên Portal (`sm`, `md`, `lg`).",
    )
    assistant_system_prompt = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True,
        help_text="Policy / chỉ dẫn trả lời bổ sung của Chatbot AI.",
    )
    preferred_ai_model = serializers.CharField(
        max_length=120,
        required=False,
        allow_blank=True,
        help_text="Model AI ưu tiên (để trống = tự động fallback theo ENV).",
    )
    ai_daily_token_limit = serializers.IntegerField(
        min_value=100,
        required=False,
        allow_null=True,
        help_text="Giới hạn token AI mỗi ngày cho mỗi người dùng (null = không đặt giới hạn).",
    )
    telegram_ai_enabled = serializers.BooleanField(
        required=False, help_text="Bật tương tác Chatbot AI qua Bot Telegram chung."
    )
    telegram_group_require_mention = serializers.BooleanField(
        required=False, help_text="Trong nhóm Telegram bắt buộc `@bot` hoặc reply tin nhắn bot."
    )
    telegram_group_tool_policy = serializers.ChoiceField(
        choices=[(item.value, item.value) for item in GroupToolPolicy],
        required=False,
        help_text="Chính sách đọc dữ liệu cá nhân trong nhóm Telegram.",
    )
    telegram_group_hide_amounts = serializers.BooleanField(
        required=False, help_text="Ẩn số tiền nhạy cảm khi bot trả lời trong nhóm Telegram."
    )
    telegram_group_reply_in_dm = serializers.BooleanField(
        required=False, help_text="Gửi chi tiết riêng tư về DM chính chủ khi được hỏi trong nhóm."
    )
    digest_time_slots = serializers.ListField(
        child=serializers.CharField(max_length=5),
        required=False,
        max_length=8,
        help_text="Khung giờ gửi bản tin hàng ngày toàn hệ thống (`HH:MM`).",
    )
    digest_sections = serializers.ListField(
        child=serializers.CharField(max_length=32),
        required=False,
        max_length=10,
        help_text="Các mục hiển thị trong bản tin hàng ngày.",
    )
    warranty_alert_days = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=365),
        required=False,
        max_length=10,
        help_text="Số ngày nhắc trước mặc định khi thiết bị sắp hết bảo hành.",
    )
    subscription_default_alert_days = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=365),
        required=False,
        max_length=10,
        help_text="Số ngày nhắc trước mặc định khi dịch vụ định kỳ sắp gia hạn.",
    )
