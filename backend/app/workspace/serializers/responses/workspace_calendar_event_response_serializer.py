"""Response một sự kiện trên Lịch Tổng hợp (`PortalCalendar`)."""

from typing import Any

from rest_framework import serializers


class WorkspaceCalendarEventResponseSerializer(serializers.Serializer[Any]):
    """Sự kiện hợp nhất từ 4 nguồn (dịch vụ, nhắc việc, bảo hành TB, phiếu sửa)."""

    id = serializers.CharField(help_text="Khóa định danh duy nhất sự kiện trên lịch.")
    source_id = serializers.UUIDField(help_text="ID bản ghi gốc.")
    type = serializers.CharField(help_text="Loại sự kiện (`subscription`, `reminder`, ...).")
    date = serializers.DateField(help_text="Ngày diễn ra sự kiện (YYYY-MM-DD).")
    time = serializers.CharField(allow_blank=True, help_text="Giờ cụ thể nếu có (HH:MM).")
    title = serializers.CharField(help_text="Tiêu đề ngắn hiển thị trên ô lịch.")
    subtitle = serializers.CharField(allow_blank=True, help_text="Thông tin phụ.")
    status = serializers.CharField(allow_blank=True, help_text="Trạng thái sự kiện.")
    amount_vnd = serializers.DecimalField(
        max_digits=18,
        decimal_places=0,
        allow_null=True,
        help_text="Số tiền liên quan VNĐ (nếu có).",
    )
    is_completed = serializers.BooleanField(help_text="Đã hoàn thành/xử lý hay chưa.")
    link = serializers.CharField(help_text="Đường dẫn trang chi tiết nội bộ.")
