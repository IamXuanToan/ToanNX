"""Serializer response URL chuyển hướng OAuth."""

from rest_framework import serializers


class SocialAuthUrlResponseSerializer(serializers.Serializer):
    """Thông tin URL xác thực trả về cho client."""

    authorization_url = serializers.CharField(
        help_text="Đường dẫn đầy đủ chuyển hướng tới trang đăng nhập của nhà cung cấp.",
    )
