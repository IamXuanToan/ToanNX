"""Serializer validate tham số yêu cầu lấy URL xác thực OAuth."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class SocialAuthUrlValidateSerializer(CoreValidateSerializer):
    """Validate query parameters khi yêu cầu URL xác thực OAuth."""

    redirect_uri = serializers.CharField(
        max_length=1024,
        required=True,
        help_text="URL callback của frontend sau khi OAuth hoàn tất.",
    )
    state = serializers.CharField(
        max_length=255,
        required=True,
        help_text="Chuỗi state ngẫu nhiên chống tấn công CSRF OAuth.",
    )
    action = serializers.ChoiceField(
        choices=["login", "link"],
        default="login",
        required=False,
        help_text="Mục đích xác thực: đăng nhập (login) hoặc liên kết tài khoản (link).",
    )
