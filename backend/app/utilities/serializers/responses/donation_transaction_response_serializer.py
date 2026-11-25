"""Serializer response cho Giao dịch quyên góp (DonationTransaction)."""

from rest_framework import serializers

from app.utilities.models.donation_transaction import DonationTransaction


class DonationTransactionResponseSerializer(serializers.ModelSerializer[DonationTransaction]):
    """Chi tiết giao dịch quyên góp."""

    page_id = serializers.UUIDField(source="page.id", help_text="ID trang nhận.")
    page_title = serializers.CharField(source="page.title", help_text="Tiêu đề trang.")

    class Meta:
        model = DonationTransaction
        fields: tuple[str, ...] = (
            "id",
            "page_id",
            "page_title",
            "qr_item_id",
            "sepay_id",
            "amount",
            "donor_title",
            "message",
            "original_content",
            "gift_type",
            "gift_label",
            "tier",
            "tier_expires_at",
            "is_hidden",
            "is_censored",
            "received_at",
            "created_at",
            "updated_at",
        )
        read_only_fields: tuple[str, ...] = fields
