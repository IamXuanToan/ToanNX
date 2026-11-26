"""Validate cập nhật một phần Thiết bị cá nhân."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.constants.workspace_notification_channel import WorkspaceNotificationChannel
from app.workspace.models.asset import Asset


class AssetUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH thiết bị cá nhân."""

    name = serializers.CharField(max_length=200, required=False, help_text="Tên nhận diện thiết bị.")
    brand = serializers.CharField(
        max_length=100, required=False, allow_blank=True, help_text="Hãng sản xuất."
    )
    model_code = serializers.CharField(
        max_length=100, required=False, allow_blank=True, help_text="Mã model."
    )
    category = serializers.ChoiceField(
        choices=Asset.Category.choices, required=False, help_text="Nhóm thiết bị."
    )
    serial_number = serializers.CharField(
        max_length=100, required=False, allow_blank=True, help_text="Số Serial."
    )
    imei = serializers.CharField(max_length=50, required=False, allow_blank=True, help_text="Số IMEI.")
    specs = serializers.DictField(required=False, help_text="Thông số kỹ thuật dạng JSON.")
    status = serializers.ChoiceField(
        choices=Asset.Status.choices, required=False, help_text="Trạng thái thiết bị."
    )
    purchase_date = serializers.DateField(required=False, help_text="Ngày mua thiết bị.")
    purchase_price = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        required=False,
        help_text="Giá mua nguyên tệ.",
    )
    currency_id = serializers.UUIDField(required=False, help_text="ID tiền tệ.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá quy đổi VNĐ.",
    )
    purchase_store = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Nơi mua."
    )
    purchase_channel = serializers.ChoiceField(
        choices=Asset.PurchaseChannel.choices, required=False, help_text="Kênh mua hàng."
    )
    purchase_branch_address = serializers.CharField(
        max_length=255, required=False, allow_blank=True, help_text="Địa chỉ chi nhánh mua."
    )
    purchase_order_code = serializers.CharField(
        max_length=100, required=False, allow_blank=True, help_text="Mã đơn hàng."
    )
    purchase_order_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, help_text="Link đơn hàng."
    )
    store_warranty_contact = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Liên hệ bảo hành nơi bán."
    )
    warranty_type = serializers.ChoiceField(
        choices=Asset.WarrantyType.choices, required=False, help_text="Loại bảo hành."
    )
    warranty_months = serializers.IntegerField(
        min_value=0, required=False, allow_null=True, help_text="Số tháng bảo hành."
    )
    warranty_start_date = serializers.DateField(
        required=False, allow_null=True, help_text="Ngày bắt đầu bảo hành."
    )
    warranty_end_date = serializers.DateField(
        required=False, allow_null=True, help_text="Ngày hết hạn bảo hành."
    )
    warranty_provider = serializers.CharField(
        max_length=150, required=False, allow_blank=True, help_text="Đơn vị bảo hành."
    )
    warranty_note = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú bảo hành.")
    invoice_attachment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Danh sách ID tệp hóa đơn riêng tư mới.",
    )
    notes = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú chung.")
    notification_channels = serializers.ListField(
        child=serializers.ChoiceField(choices=[(c.value, c.value) for c in WorkspaceNotificationChannel]),
        min_length=1,
        max_length=len(WorkspaceNotificationChannel),
        required=False,
        help_text="Kênh nhận thông báo hết bảo hành (`WEBSITE`, `TELEGRAM`, `EMAIL`).",
    )
