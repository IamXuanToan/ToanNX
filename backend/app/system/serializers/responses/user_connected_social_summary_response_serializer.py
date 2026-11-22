"""Serializer tóm tắt tài khoản mạng xã hội liên kết của người dùng."""

from rest_framework import serializers


class UserConnectedSocialSummaryResponseSerializer(serializers.Serializer):
    """Thông tin tóm tắt tài khoản mạng xã hội đã liên kết của người dùng."""

    id = serializers.UUIDField(help_text="ID bản ghi liên kết.")
    provider = serializers.CharField(help_text="Nền tảng (google, github).")
    uid = serializers.CharField(help_text="ID định danh từ nền tảng.")
    email = serializers.CharField(help_text="Email nhận được từ nền tảng.")
    display_name = serializers.CharField(help_text="Tên hiển thị trên nền tảng.")
    avatar_url = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="URL ảnh đại diện từ nền tảng.",
    )
    created_at = serializers.DateTimeField(help_text="Thời điểm liên kết.")
