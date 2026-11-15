"""Danh mục chủ phiên để lọc; chỉ trả thông tin định danh đã hiển thị trên màn phiên."""

from rest_framework import serializers


class AdminSessionUserResponseSerializer(serializers.Serializer):
    """Serialize kết quả values từ repository, không truy vấn tài khoản."""

    id = serializers.UUIDField(source="user_id", help_text="UUID người dùng có phiên chưa xóa.")
    email = serializers.EmailField(source="user__email", help_text="Email chủ phiên.")
    username = serializers.CharField(
        source="user__username", allow_null=True, help_text="Tên đăng nhập chủ phiên."
    )
    first_name = serializers.CharField(source="user__first_name", help_text="Tên chủ phiên.")
    last_name = serializers.CharField(source="user__last_name", help_text="Họ chủ phiên.")
