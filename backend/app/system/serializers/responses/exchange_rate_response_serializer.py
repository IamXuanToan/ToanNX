"""Response tỷ giá."""

from rest_framework import serializers

from app.system.models.exchange_rate import ExchangeRate


class ExchangeRateResponseSerializer(serializers.ModelSerializer[ExchangeRate]):
    """Tỷ giá (dòng API chỉ đọc)."""

    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")

    class Meta:
        model = ExchangeRate
        fields = (
            "id",
            "currency_id",
            "currency_code",
            "rate_date",
            "rate",
            "source",
            "fetched_at",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
