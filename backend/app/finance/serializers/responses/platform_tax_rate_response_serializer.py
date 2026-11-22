"""Response một mốc khấu trừ."""

from rest_framework import serializers

from app.finance.models.platform_tax_rate import PlatformTaxRate


class PlatformTaxRateResponseSerializer(serializers.ModelSerializer[PlatformTaxRate]):
    """Mốc khấu trừ."""

    class Meta:
        model = PlatformTaxRate
        fields = (
            "id",
            "platform_id",
            "effective_from",
            "tax_withheld",
            "rate",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
