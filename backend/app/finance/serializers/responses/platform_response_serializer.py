"""Response nền tảng."""

from typing import Any

from django.utils import timezone
from rest_framework import serializers

from app.finance.models.platform import Platform
from app.finance.utils.vn_time import vn_date


class PlatformResponseSerializer(serializers.ModelSerializer[Platform]):
    """Nền tảng + khấu trừ đang áp dụng hôm nay (từ lịch sử đã prefetch)."""

    default_currency_code = serializers.CharField(
        source="default_currency.code", read_only=True, help_text="Mã tiền tệ."
    )
    current_tax = serializers.SerializerMethodField(help_text="Mốc áp dụng hôm nay hoặc null.")

    def get_current_tax(self, obj: Platform) -> dict[str, Any] | None:
        """`{effective_from, tax_withheld, rate}` của mốc mới nhất có hiệu lực hôm nay."""
        today = vn_date(timezone.now())
        entries = sorted(
            (entry for entry in obj.tax_rates.all() if entry.effective_from <= today),
            key=lambda entry: entry.effective_from,
            reverse=True,
        )
        if not entries:
            return None
        entry = entries[0]
        return {
            "effective_from": entry.effective_from,
            "tax_withheld": entry.tax_withheld,
            "rate": str(entry.rate),
        }

    class Meta:
        model = Platform
        fields = (
            "id",
            "name",
            "code",
            "default_currency_id",
            "default_currency_code",
            "color",
            "is_active",
            "note",
            "current_tax",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
