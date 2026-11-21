"""Validate body PATCH /account/users/{id}."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class UserUpdateValidateSerializer(CoreValidateSerializer):
    """Dữ liệu cập nhật người dùng (mọi field tùy chọn). `avatar_id: null` để gỡ ảnh."""

    email = serializers.EmailField(
        required=False, max_length=254, help_text="Email đăng nhập (lưu chữ thường, duy nhất)."
    )
    password = serializers.CharField(
        required=False,
        write_only=True,
        max_length=128,
        trim_whitespace=False,
        help_text="Mật khẩu mới; đổi mật khẩu sẽ thu hồi mọi phiên của người dùng.",
    )
    username = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=150,
        help_text="Tên người dùng bắt buộc và duy nhất.",
    )
    full_name = serializers.CharField(
        required=False, allow_blank=False, max_length=255, help_text="Họ và tên đầy đủ."
    )
    avatar_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Id attachment ảnh đại diện (upload qua /attachments); null để gỡ ảnh.",
    )
    is_active = serializers.BooleanField(
        required=False, help_text="Cho phép đăng nhập; tắt để khóa tài khoản và thu hồi mọi phiên."
    )
    is_staff = serializers.BooleanField(
        required=False, help_text="Cho vào khu vực quản trị (từng chức năng vẫn cần quyền)."
    )
    is_superuser = serializers.BooleanField(
        required=False, help_text="Toàn quyền tầng ứng dụng; chỉ superuser được bật/tắt."
    )
    is_novel = serializers.BooleanField(
        required=False, help_text="Đánh dấu nhóm nghiệp vụ Novel (không tự cấp quyền)."
    )
