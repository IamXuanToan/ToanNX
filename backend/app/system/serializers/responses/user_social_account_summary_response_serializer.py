"""Serializer response tóm tắt tài khoản mạng xã hội liên kết."""

from rest_framework import serializers


class UserSocialAccountSummaryResponseSerializer(serializers.Serializer):
    """Thông tin trạng thái liên kết của một nền tảng mạng xã hội."""

    provider = serializers.CharField(help_text="Tên nền tảng (google, github...).")
    is_configured = serializers.BooleanField(help_text="Hệ thống đã cấu hình Client ID / Secret chưa.")
    is_enabled = serializers.BooleanField(default=True, help_text="Quản trị viên có đang bật phương thức này không.")
    is_connected = serializers.BooleanField(help_text="Người dùng đã liên kết với nền tảng này chưa.")
    email = serializers.CharField(allow_blank=True, help_text="Email đã liên kết.")
    display_name = serializers.CharField(allow_blank=True, help_text="Tên hiển thị trên nền tảng.")
    avatar_url = serializers.CharField(allow_blank=True, help_text="URL ảnh đại diện trên nền tảng.")
    connected_at = serializers.CharField(allow_null=True, help_text="Thời điểm liên kết (ISO 8601).")
