"""Response Tổng quan Dashboard Portal (`GET /workspace/dashboard/summary`)."""

from typing import Any

from rest_framework import serializers

from app.workspace.serializers.responses.workspace_dashboard_reminder_response_serializer import (
    WorkspaceDashboardReminderResponseSerializer,
)


class WorkspaceDashboardSummaryResponseSerializer(serializers.Serializer[Any]):
    """4 chỉ số KPI tổng hợp & danh sách nhắc việc hôm nay."""

    owner_id = serializers.UUIDField(help_text="ID chủ sở hữu đang xem.")
    timezone = serializers.CharField(help_text="Múi giờ tính lịch của chủ sở hữu.")
    today = serializers.DateField(help_text="Ngày hiện tại theo múi giờ owner.")
    monthly_spending_vnd = serializers.DecimalField(
        max_digits=18, decimal_places=0, help_text="Tổng chi tiêu đã ghi nhận tháng hiện tại (VNĐ)."
    )
    subscription_paid_vnd = serializers.DecimalField(
        max_digits=18, decimal_places=0, help_text="Tiền gia hạn dịch vụ tháng này (VNĐ)."
    )
    asset_purchase_vnd = serializers.DecimalField(
        max_digits=18, decimal_places=0, help_text="Tiền mua thiết bị tháng này (VNĐ)."
    )
    warranty_repair_vnd = serializers.DecimalField(
        max_digits=18, decimal_places=0, help_text="Chi phí bảo hành/sửa chữa tháng này (VNĐ)."
    )
    projected_subscriptions_vnd = serializers.DecimalField(
        max_digits=18, decimal_places=0, help_text="Tiền dự kiến gia hạn còn lại trong tháng (VNĐ)."
    )
    pending_reminders_today = serializers.IntegerField(help_text="Số việc hôm nay chưa hoàn thành.")
    overdue_reminders = serializers.IntegerField(help_text="Số việc quá hạn chưa hoàn thành.")
    expiring_warranties_30d = serializers.IntegerField(
        help_text="Số thiết bị sắp hết bảo hành trong 30 ngày tới."
    )
    upcoming_subscriptions_14d = serializers.IntegerField(
        help_text="Số dịch vụ sắp gia hạn trong 14 ngày tới."
    )
    upcoming_subscriptions_14d_vnd = serializers.DecimalField(
        max_digits=18, decimal_places=0, help_text="Tổng tiền dự kiến gia hạn trong 14 ngày tới."
    )
    monitors_total = serializers.IntegerField(help_text="Tổng số mục tiêu giám sát Uptime.")
    monitors_healthy = serializers.IntegerField(help_text="Số mục tiêu đang ổn định (HEALTHY).")
    monitors_down = serializers.IntegerField(help_text="Số mục tiêu đang lỗi (DOWN).")
    today_reminders = WorkspaceDashboardReminderResponseSerializer(
        many=True, help_text="Tối đa 5 nhắc việc hôm nay."
    )
