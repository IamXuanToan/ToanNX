"""Serializer validate mã ủy quyền OAuth gửi lên từ frontend."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SocialAuthCodeValidateSerializer(CoreValidateSerializer):
    """Validate body khi gửi mã ủy quyền (code) để đăng nhập hoặc liên kết."""

    code = serializers.CharField(
        max_length=1024,
        required=True,
        help_text="Mã ủy quyền nhận được từ nhà cung cấp OAuth.",
    )
    redirect_uri = serializers.CharField(
        max_length=1024,
        required=True,
        help_text="Redirect URI đã dùng khi khởi tạo yêu cầu OAuth.",
    )
