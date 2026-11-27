"""Validate tạo mới Thiết bị cá nhân."""

from decimal import Decimal

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.asset import Asset


class AssetCreateValidateSerializer(CoreValidateSerializer):
    """Đầu vào tạo Asset kèm nơi mua, quy đổi tiền tệ, bảo hành và hóa đơn riêng tư."""

    name = serializers.CharField(max_length=200, help_text="Tên nhận diện thiết bị.")
    brand = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="", help_text="Hãng sản xuất."
    )
    model_code = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="", help_text="Mã model."
    )
    category = serializers.ChoiceField(
        choices=Asset.Category.choices,
        required=False,
        default=Asset.Category.OTHER,
        help_text="Nhóm thiết bị.",
    )
    serial_number = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="", help_text="Số Serial."
    )
    imei = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default="", help_text="Số IMEI."
    )
    specs = serializers.DictField(
        required=False, default=dict, help_text="Thông số kỹ thuật dạng JSON key-value."
    )
    status = serializers.ChoiceField(
        choices=Asset.Status.choices,
        required=False,
        default=Asset.Status.IN_USE,
        help_text="Trạng thái sử dụng hiện tại.",
    )
    purchase_date = serializers.DateField(help_text="Ngày mua thiết bị (YYYY-MM-DD).")
    purchase_price = serializers.DecimalField(
        max_digits=18,
        decimal_places=2,
        min_value=Decimal("0"),
        default=Decimal("0"),
        required=False,
        help_text="Giá mua theo tiền tệ gốc.",
    )
    currency_id = serializers.UUIDField(help_text="ID tiền tệ giao dịch.")
    exchange_rate = serializers.DecimalField(
        max_digits=18,
        decimal_places=6,
        required=False,
        allow_null=True,
        min_value=Decimal("0.000001"),
        help_text="Tỷ giá quy đổi VNĐ (bắt buộc nhập khi ngoại tệ chưa có tỷ giá tham chiếu).",
    )
    purchase_store = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Tên nơi mua."
    )
    purchase_channel = serializers.ChoiceField(
        choices=Asset.PurchaseChannel.choices,
        required=False,
        default=Asset.PurchaseChannel.RETAILER,
        help_text="Kênh mua hàng.",
    )
    purchase_branch_address = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default="", help_text="Địa chỉ chi nhánh mua."
    )
    purchase_order_code = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="", help_text="Mã đơn hàng."
    )
    purchase_order_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, default="", help_text="Link đơn hàng."
    )
    store_warranty_contact = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Liên hệ bảo hành nơi bán."
    )
    warranty_type = serializers.ChoiceField(
        choices=Asset.WarrantyType.choices,
        required=False,
        default=Asset.WarrantyType.MANUFACTURER,
        help_text="Loại hình bảo hành.",
    )
    warranty_months = serializers.IntegerField(
        min_value=0, required=False, allow_null=True, default=None, help_text="Số tháng bảo hành."
    )
    warranty_start_date = serializers.DateField(
        required=False, allow_null=True, default=None, help_text="Ngày bắt đầu bảo hành."
    )
    warranty_end_date = serializers.DateField(
        required=False, allow_null=True, default=None, help_text="Ngày hết hạn bảo hành."
    )
    warranty_provider = serializers.CharField(
        max_length=150, required=False, allow_blank=True, default="", help_text="Đơn vị bảo hành."
    )
    warranty_note = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Ghi chú bảo hành."
    )
    invoice_attachment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        help_text="Danh sách ID tệp hóa đơn riêng tư.",
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Ghi chú chung về thiết bị."
    )
