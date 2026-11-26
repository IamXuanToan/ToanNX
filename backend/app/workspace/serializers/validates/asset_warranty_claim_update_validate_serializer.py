"""Validate cập nhật một phần Phiếu Bảo hành & Sửa chữa."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim


class AssetWarrantyClaimUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH phiếu bảo hành/sửa chữa."""

    asset_id = serializers.UUIDField(required=False, help_text="ID thiết bị liên quan.")
    claim_code = serializers.CharField(max_length=32, required=False, help_text="Mã phiếu nội bộ.")
    claim_type = serializers.ChoiceField(
        choices=AssetWarrantyClaim.ClaimType.choices, required=False, help_text="Loại phiếu."
    )
    status = serializers.ChoiceField(
        choices=AssetWarrantyClaim.Status.choices, required=False, help_text="Trạng thái phiếu."
    )
    submitted_date = serializers.DateField(required=False, help_text="Ngày gửi thiết bị.")
    estimated_return_date = serializers.DateField(required=False, allow_null=True, help_text="Ngày hẹn trả.")
    returned_date = serializers.DateField(required=False, allow_null=True, help_text="Ngày thực tế nhận lại.")
    service_center = serializers.CharField(max_length=200, required=False, help_text="Tên TTBH.")
    service_center_address = serializers.CharField(
        max_length=255, required=False, allow_blank=True, help_text="Địa chỉ TTBH."
    )
    service_center_contact = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Liên hệ TTBH."
    )
    external_ticket_code = serializers.CharField(
        max_length=100, required=False, allow_blank=True, help_text="Mã biên nhận hãng/cửa hàng."
    )
    issue_description = serializers.CharField(required=False, help_text="Mô tả lỗi.")
    resolution_notes = serializers.CharField(required=False, allow_blank=True, help_text="Kết quả xử lý.")
    is_covered_by_warranty = serializers.BooleanField(required=False, help_text="Được bảo hành miễn phí.")
    cost = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        help_text="Chi phí phát sinh nguyên tệ.",
    )
    currency_id = serializers.UUIDField(required=False, help_text="ID tiền tệ.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá sang VNĐ.",
    )
    part_warranty_months = serializers.IntegerField(
        min_value=0, required=False, allow_null=True, help_text="Số tháng BH linh kiện mới."
    )
    part_warranty_end_date = serializers.DateField(
        required=False, allow_null=True, help_text="Ngày hết hạn BH linh kiện mới."
    )
    attachment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Danh sách ID tệp biên nhận riêng tư.",
    )
