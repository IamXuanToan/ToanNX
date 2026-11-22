"""Response trạng thái kết nối SePay của chính mình."""

from typing import Any

from django.conf import settings
from rest_framework import serializers


class SepayStatusResponseSerializer(serializers.Serializer[Any]):
    """Không bao giờ trả token, chỉ 4 ký tự cuối; secret webhook là của chính người xem."""

    connected = serializers.BooleanField(help_text="Đã lưu token API.")
    environment = serializers.SerializerMethodField(help_text="sandbox / production.")
    is_active = serializers.BooleanField(source="connection.is_active", default=False, help_text="Đang bật.")
    token_last4 = serializers.CharField(
        source="connection.token_last4", default="", help_text="4 ký tự cuối token."
    )
    webhook_url = serializers.CharField(help_text="URL webhook riêng.")
    webhook_secret = serializers.CharField(help_text="Secret dán vào SePay.")
    last_webhook_at = serializers.DateTimeField(
        source="connection.last_webhook_at", default=None, help_text="Webhook lần cuối."
    )
    last_sync_at = serializers.DateTimeField(
        source="connection.last_sync_at", default=None, help_text="Lấy thủ công lần cuối."
    )
    last_error = serializers.CharField(source="connection.last_error", default="", help_text="Lỗi gần nhất.")

    def get_environment(self, obj: Any) -> str:
        """Môi trường SePay đang dùng."""
        return str(settings.SEPAY_ENV)
