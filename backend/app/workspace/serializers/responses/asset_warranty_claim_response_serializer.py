"""Response Phiếu Bảo hành & Sửa chữa thiết bị."""

from rest_framework import serializers

from app.system.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim


class AssetWarrantyClaimResponseSerializer(serializers.ModelSerializer[AssetWarrantyClaim]):
    """Chi tiết/danh sách phiếu bảo hành & biên nhận riêng tư."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    asset_name = serializers.CharField(source="asset.name", read_only=True, help_text="Tên thiết bị.")
    asset_brand = serializers.CharField(
        source="asset.brand", read_only=True, default="", help_text="Hãng thiết bị."
    )
    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")
    currency_symbol = serializers.CharField(
        source="currency.symbol", read_only=True, help_text="Ký hiệu tiền tệ."
    )
    currency_decimal_places = serializers.IntegerField(
        source="currency.decimal_places", read_only=True, help_text="Số chữ số thập phân."
    )
    attachments = AttachmentDetailResponseSerializer(
        many=True, read_only=True, help_text="Biên nhận / hóa đơn sửa chữa riêng tư."
    )

    class Meta:
        model = AssetWarrantyClaim
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "asset_id",
            "asset_name",
            "asset_brand",
            "claim_code",
            "claim_type",
            "status",
            "submitted_date",
            "estimated_return_date",
            "returned_date",
            "service_center",
            "service_center_address",
            "service_center_contact",
            "external_ticket_code",
            "issue_description",
            "resolution_notes",
            "is_covered_by_warranty",
            "cost",
            "currency_id",
            "currency_code",
            "currency_symbol",
            "currency_decimal_places",
            "exchange_rate",
            "cost_vnd",
            "part_warranty_months",
            "part_warranty_end_date",
            "attachments",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
