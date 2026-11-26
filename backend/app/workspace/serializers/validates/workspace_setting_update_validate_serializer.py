"""Validate cập nhật Cài đặt Trợ lý cá nhân, Lịch Digest & Chính sách Telegram Group."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.workspace_setting import WorkspaceSetting


class WorkspaceSettingUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PUT/PATCH `/workspace/settings`."""

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
        help_text=(
            "Các mục hiển thị trong Digest (`reminders`, `warranty`, `subscriptions`, `monitors`, `finance`)."
        ),
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
    preferred_ai_model = serializers.CharField(
        max_length=120,
        required=False,
        allow_blank=True,
        help_text="Model AI ưu tiên (để trống = dùng thứ tự mặc định của hệ thống).",
    )
    ai_daily_token_limit = serializers.IntegerField(
        min_value=100,
        required=False,
        allow_null=True,
        help_text="Giới hạn token AI mỗi ngày (null = không đặt giới hạn).",
    )
    telegram_ai_enabled = serializers.BooleanField(
        required=False, help_text="Bật tương tác Trợ lý AI qua Bot Telegram."
    )
    telegram_allowed_chat_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Danh sách UUID của `system.TelegramChat` được phép gọi Trợ lý.",
    )
    telegram_group_require_mention = serializers.BooleanField(
        required=False, help_text="Trong nhóm Telegram bắt buộc `@bot` hoặc reply tin nhắn bot."
    )
    telegram_group_tool_policy = serializers.ChoiceField(
        choices=WorkspaceSetting.GroupToolPolicy.choices,
        required=False,
        help_text="Chính sách đọc dữ liệu cá nhân trong nhóm Telegram.",
    )
    telegram_group_hide_amounts = serializers.BooleanField(
        required=False, help_text="Ẩn số tiền nhạy cảm khi bot trả lời trong nhóm Telegram."
    )
    telegram_group_reply_in_dm = serializers.BooleanField(
        required=False, help_text="Gửi chi tiết riêng tư về DM chính chủ khi được hỏi trong nhóm."
    )
