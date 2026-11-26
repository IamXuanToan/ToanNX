"""Validate tạo mới Phiếu Bảo hành & Sửa chữa."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim


class AssetWarrantyClaimCreateValidateSerializer(CoreValidateSerializer):
    """Đầu vào tạo phiếu gửi bảo hành/sửa chữa cho thiết bị."""

    asset_id = serializers.UUIDField(help_text="ID thiết bị được gửi bảo hành/sửa chữa.")
    claim_code = serializers.CharField(
        max_length=32,
        required=False,
        allow_blank=True,
        default="",
        help_text="Mã phiếu nội bộ (bỏ trống để tự sinh BH-YYYYMM-NNN).",
    )
    claim_type = serializers.ChoiceField(
        choices=AssetWarrantyClaim.ClaimType.choices,
        required=False,
        default=AssetWarrantyClaim.ClaimType.WARRANTY,
        help_text="Loại phiếu (WARRANTY, PAID_REPAIR, MAINTENANCE).",
    )
    status = serializers.ChoiceField(
        choices=AssetWarrantyClaim.Status.choices,
        required=False,
        default=AssetWarrantyClaim.Status.SUBMITTED,
        help_text="Trạng thái tiếp nhận ban đầu.",
    )
    submitted_date = serializers.DateField(help_text="Ngày bàn giao thiết bị đi bảo hành.")
    estimated_return_date = serializers.DateField(
        required=False, allow_null=True, default=None, help_text="Ngày hẹn trả dự kiến."
    )
    returned_date = serializers.DateField(
        required=False, allow_null=True, default=None, help_text="Ngày thực tế nhận lại thiết bị."
    )
    service_center = serializers.CharField(
        max_length=200, help_text="Tên trung tâm bảo hành hoặc cửa hàng sửa chữa."
    )
    service_center_address = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default="", help_text="Địa chỉ TTBH."
    )
    service_center_contact = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Hotline/liên hệ TTBH."
    )
    external_ticket_code = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="", help_text="Mã biên nhận bên ngoài."
    )
    issue_description = serializers.CharField(help_text="Mô tả lỗi hoặc yêu cầu kiểm tra.")
    resolution_notes = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Kết quả xử lý."
    )
    is_covered_by_warranty = serializers.BooleanField(
        required=False, default=True, help_text="Được bảo hành miễn phí hay tự trả phí."
    )
    cost = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        default=Decimal("0"),
        help_text="Chi phí phát sinh theo nguyên tệ.",
    )
    currency_id = serializers.UUIDField(help_text="ID tiền tệ của chi phí.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá sang VNĐ.",
    )
    part_warranty_months = serializers.IntegerField(
        min_value=0, required=False, allow_null=True, default=None, help_text="Số tháng BH linh kiện mới."
    )
    part_warranty_end_date = serializers.DateField(
        required=False, allow_null=True, default=None, help_text="Ngày hết hạn BH linh kiện mới."
    )
    attachment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        help_text="Danh sách ID tệp biên nhận riêng tư.",
    )
