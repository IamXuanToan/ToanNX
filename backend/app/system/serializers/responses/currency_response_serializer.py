"""Response tiền tệ."""

from rest_framework import serializers

from app.system.models.currency import Currency


class CurrencyResponseSerializer(serializers.ModelSerializer[Currency]):
    """Tiền tệ."""

    class Meta:
        model = Currency
        fields = (
            "id",
            "code",
            "name",
            "symbol",
            "decimal_places",
            "is_base",
            "is_active",
            "position",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
