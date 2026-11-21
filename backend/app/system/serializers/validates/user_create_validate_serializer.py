"""Validate body POST /account/users."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class UserCreateValidateSerializer(CoreValidateSerializer):
    """Dữ liệu tạo người dùng. `avatar_id` là id attachment ảnh đã upload."""

    email = serializers.EmailField(max_length=254, help_text="Email đăng nhập (lưu chữ thường, duy nhất).")
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
        max_length=128,
        trim_whitespace=False,
        help_text="Mật khẩu thô; nếu để trống hệ thống sẽ gửi thư mời để người dùng tự thiết lập.",
    )
    username = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        default=None,
        max_length=150,
        help_text="Tên người dùng tùy chọn và duy nhất nếu có.",
    )
    send_invitation = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Tự động gửi email mời nếu tạo tài khoản không có mật khẩu.",
    )
    full_name = serializers.CharField(
        required=True, allow_blank=False, max_length=255, help_text="Họ và tên đầy đủ."
    )
    avatar_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Id attachment ảnh đại diện (upload qua /attachments); null để gỡ ảnh.",
    )
    is_active = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Cho phép đăng nhập; tắt để khóa tài khoản và thu hồi mọi phiên.",
    )
    is_staff = serializers.BooleanField(
        required=False, default=False, help_text="Cho vào khu vực quản trị (từng chức năng vẫn cần quyền)."
    )
    is_superuser = serializers.BooleanField(
        required=False, default=False, help_text="Toàn quyền tầng ứng dụng; chỉ superuser được bật/tắt."
    )
    is_novel = serializers.BooleanField(
        required=False, default=False, help_text="Đánh dấu nhóm nghiệp vụ Novel (không tự cấp quyền)."
    )

    def validate_username(self, value: str | None) -> str | None:
        """Chuẩn hóa tên người dùng: rỗng hoặc toàn khoảng trắng chuyển thành None."""
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed if trimmed else None
