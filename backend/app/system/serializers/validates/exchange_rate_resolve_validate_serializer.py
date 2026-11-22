"""Query tra cứu tỷ giá."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.models.exchange_rate import ExchangeRate


class ExchangeRateResolveValidateSerializer(CoreValidateSerializer):
    """Tiền tệ + ngày + nguồn."""

    currency_id = serializers.UUIDField(help_text="Tiền tệ.")
    date = serializers.DateField(help_text="Ngày nhận tiền.")
    rate_source = serializers.ChoiceField(
        choices=ExchangeRate.Source.choices,
        required=False,
        default=ExchangeRate.Source.VIETCOMBANK_TRANSFER_BUY,
        help_text="Nguồn.",
    )
