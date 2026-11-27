"""Response Cấu hình Chatbot AI dùng chung toàn hệ thống (Admin)."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.workspace.constants.assistant_launcher_size import AssistantLauncherSize
from app.workspace.serializers.responses.assistant_command_response_serializer import (
    AssistantCommandResponseSerializer,
)


class AssistantConfigResponseSerializer(serializers.Serializer[Any]):
    """Trọn bộ cấu hình Avatar, Tên, Kích thước nút tròn, Policy, Model, Token Limit và Telegram AI."""

    assistant_name = serializers.CharField(allow_blank=True, help_text="Tên Chatbot AI.")
    assistant_avatar = AttachmentSummaryResponseSerializer(
        allow_null=True, help_text="Ảnh đại diện Chatbot AI (null nếu dùng icon mặc định)."
    )
    launcher_size = serializers.ChoiceField(
        choices=[(item.value, item.value) for item in AssistantLauncherSize],
        help_text="Kích thước nút tròn Chatbot AI nổi trên giao diện Portal (`sm`, `md`, `lg`).",
    )
    assistant_system_prompt = serializers.CharField(
        allow_blank=True, help_text="Policy / chỉ dẫn trả lời của Chatbot AI."
    )
    preferred_ai_model = serializers.CharField(allow_blank=True, help_text="Model AI ưu tiên.")
    ai_daily_token_limit = serializers.IntegerField(
        allow_null=True, help_text="Giới hạn token mỗi ngày (null = không giới hạn)."
    )
    telegram_ai_enabled = serializers.BooleanField(help_text="Bật tương tác Chatbot AI qua Telegram.")
    telegram_group_require_mention = serializers.BooleanField(
        help_text="Nhóm Telegram phải @tag hoặc reply bot."
    )
    telegram_group_tool_policy = serializers.CharField(help_text="Chính sách tool trong nhóm Telegram.")
    telegram_group_hide_amounts = serializers.BooleanField(help_text="Ẩn số tiền trong nhóm Telegram.")
    telegram_group_reply_in_dm = serializers.BooleanField(help_text="Gửi chi tiết riêng tư qua DM.")
    available_ai_models = serializers.ListField(
        child=serializers.CharField(), help_text="Danh sách model AI khả dụng từ ENV."
    )
    telegram_bot_configured = serializers.BooleanField(help_text="Bot Telegram đã cấu hình ENV chưa.")
    telegram_bot_username = serializers.CharField(allow_blank=True, help_text="Username bot Telegram.")
    telegram_bot_url = serializers.CharField(allow_blank=True, help_text="Liên kết mở bot Telegram.")
    telegram_commands = AssistantCommandResponseSerializer(
        many=True,
        help_text="Danh sách câu lệnh chuẩn có sẵn để Admin khai báo vào @BotFather (/setcommands).",
    )
    digest_time_slots = serializers.ListField(
        child=serializers.CharField(), help_text="Khung giờ gửi bản tin hàng ngày (`HH:MM`)."
    )
    digest_sections = serializers.ListField(
        child=serializers.CharField(), help_text="Các mục hiển thị trong bản tin hàng ngày."
    )
    available_digest_sections = serializers.ListField(
        child=serializers.CharField(), help_text="Danh sách mục bản tin hợp lệ được hỗ trợ."
    )
    warranty_alert_days = serializers.ListField(
        child=serializers.IntegerField(), help_text="Mốc ngày nhắc bảo hành mặc định."
    )
    subscription_default_alert_days = serializers.ListField(
        child=serializers.IntegerField(), help_text="Mốc ngày nhắc gia hạn mặc định."
    )
