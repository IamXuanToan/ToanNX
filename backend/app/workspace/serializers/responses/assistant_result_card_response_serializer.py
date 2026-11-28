"""Response thẻ kết quả (dữ liệu thật do server dựng) trong tin nhắn Trợ lý AI."""

from typing import Any

from rest_framework import serializers


class AssistantResultCardResponseSerializer(serializers.Serializer[Any]):
    """Thẻ kết quả tạo/sửa: tiêu đề, link xem chi tiết Portal; link rút gọn có thêm thông tin riêng."""

    type = serializers.CharField(help_text="Loại thẻ (`reminder`, `short_link`, `asset`...).")
    kind_label = serializers.CharField(
        allow_blank=True, help_text="Nhãn loại bản ghi tiếng Việt (VD `nhắc việc`)."
    )
    action = serializers.CharField(help_text="`created` hoặc `updated`.")
    id = serializers.CharField(help_text="ID bản ghi.")
    title = serializers.CharField(allow_blank=True, help_text="Tên hiển thị.")
    url = serializers.CharField(help_text="URL chính: link rút gọn đầy đủ, hoặc trang xem chi tiết.")
    view_url = serializers.CharField(help_text="Trang xem chi tiết bản ghi trong Client Portal.")
    destination_url = serializers.CharField(allow_blank=True, help_text="URL đích.")
    redirect_mode = serializers.CharField(allow_blank=True, help_text="Mô tả kiểu chuyển hướng.")
    has_password = serializers.BooleanField(help_text="Có mật khẩu bảo vệ.")
    expires_at = serializers.CharField(allow_null=True, help_text="Thời điểm hết hạn ISO hoặc null.")
    status = serializers.CharField(allow_blank=True, help_text="Trạng thái bản ghi.")
