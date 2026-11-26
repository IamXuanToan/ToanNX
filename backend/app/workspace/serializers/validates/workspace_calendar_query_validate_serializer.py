"""Validate tham số truy vấn Lịch Tổng hợp (`GET /workspace/calendar`)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class WorkspaceCalendarQueryValidateSerializer(CoreValidateSerializer):
    """Kiểm tra `from` (`start_date`), `to` (`end_date`), `types` và `owner`."""

    start_date = serializers.DateField(help_text="Ngày bắt đầu khoảng lịch (YYYY-MM-DD).")
    end_date = serializers.DateField(help_text="Ngày kết thúc khoảng lịch (YYYY-MM-DD).")
    types = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        default=list,
        help_text=("Danh sách loại sự kiện (`subscription,reminder,asset_warranty,warranty_claim`)."),
    )
    owner = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
        help_text="ID chủ sở hữu (chỉ có tác dụng khi có quyền `manage_all`).",
    )
