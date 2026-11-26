"""Response Thiết bị cá nhân kèm nơi mua, hạn bảo hành & thống kê phiếu bảo hành."""

from decimal import Decimal

from rest_framework import serializers

from app.system.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)
from app.workspace.models.asset import Asset


class AssetResponseSerializer(serializers.ModelSerializer[Asset]):
    """Chi tiết/danh sách thiết bị (annotations từ AssetRepository, 0 N+1)."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    owner_name = serializers.CharField(
        source="owner.full_name", read_only=True, default="", help_text="Tên chủ sở hữu."
    )
    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")
    currency_symbol = serializers.CharField(
        source="currency.symbol", read_only=True, help_text="Ký hiệu tiền tệ."
    )
    currency_decimal_places = serializers.IntegerField(
        source="currency.decimal_places", read_only=True, help_text="Số chữ số thập phân."
    )
    invoice_attachments = AttachmentDetailResponseSerializer(
        many=True, read_only=True, help_text="Danh sách hóa đơn/chứng từ riêng tư."
    )
    warranty_claim_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Tổng số phiếu bảo hành."
    )
    repair_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Tổng số lần sửa chữa/bảo trì ngoài."
    )
    total_claim_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Tổng số phiếu BH & sửa chữa."
    )
    open_claim_count = serializers.IntegerField(
        read_only=True, default=0, help_text="Số phiếu đang mở xử lý."
    )
    total_service_cost_vnd = serializers.DecimalField(
        max_digits=18,
        decimal_places=0,
        read_only=True,
        default=Decimal("0"),
        help_text="Tổng chi phí sửa chữa/BH đã phát sinh (VNĐ).",
    )
    last_claim_date = serializers.DateField(
        read_only=True,
        allow_null=True,
        default=None,
        help_text="Ngày gửi bảo hành/sửa chữa gần nhất.",
    )

    class Meta:
        model = Asset
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "owner_name",
            "name",
            "brand",
            "model_code",
            "category",
            "serial_number",
            "imei",
            "specs",
            "status",
            "purchase_date",
            "purchase_price",
            "currency_id",
            "currency_code",
            "currency_symbol",
            "currency_decimal_places",
            "exchange_rate",
            "purchase_price_vnd",
            "purchase_store",
            "purchase_channel",
            "purchase_branch_address",
            "purchase_order_code",
            "purchase_order_url",
            "store_warranty_contact",
            "warranty_type",
            "warranty_months",
            "warranty_start_date",
            "warranty_end_date",
            "warranty_provider",
            "warranty_note",
            "invoice_attachments",
            "notes",
            "warranty_claim_count",
            "repair_count",
            "total_claim_count",
            "open_claim_count",
            "total_service_cost_vnd",
            "last_claim_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
