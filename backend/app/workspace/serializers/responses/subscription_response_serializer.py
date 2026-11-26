"""Response Dịch vụ & Gói đăng ký định kỳ."""

from rest_framework import serializers

from app.workspace.models.subscription import Subscription


class SubscriptionResponseSerializer(serializers.ModelSerializer[Subscription]):
    """Chi tiết/danh sách gói dịch vụ định kỳ."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    currency_code = serializers.CharField(source="currency.code", read_only=True, help_text="Mã tiền tệ.")
    currency_symbol = serializers.CharField(
        source="currency.symbol", read_only=True, help_text="Ký hiệu tiền tệ."
    )
    currency_decimal_places = serializers.IntegerField(
        source="currency.decimal_places", read_only=True, help_text="Số chữ số thập phân."
    )

    class Meta:
        model = Subscription
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "name",
            "provider",
            "category",
            "billing_cycle",
            "custom_cycle_days",
            "anchor_day",
            "amount",
            "currency_id",
            "currency_code",
            "currency_symbol",
            "currency_decimal_places",
            "exchange_rate",
            "amount_vnd",
            "renew_date",
            "auto_renew",
            "payment_method",
            "manage_url",
            "reminder_days_before",
            "notification_channels",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
