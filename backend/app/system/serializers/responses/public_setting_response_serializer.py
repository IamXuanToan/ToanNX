"""Serializer response danh sách cấu hình công khai."""

from rest_framework import serializers


class PublicSettingResponseSerializer(serializers.Serializer):
    """Thông tin các tham số cấu hình công khai cho client."""

    auth_google_enabled = serializers.BooleanField(
        default=True,
        help_text="Trạng thái cho phép đăng nhập qua Google.",
    )
    auth_github_enabled = serializers.BooleanField(
        default=True,
        help_text="Trạng thái cho phép đăng nhập qua GitHub.",
    )
    settings = serializers.DictField(
        child=serializers.JSONField(),
        required=False,
        default=dict,
        help_text="Bản đồ key-value các cấu hình công khai khác.",
    )
