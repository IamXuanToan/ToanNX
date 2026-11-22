"""Response sau khi thêm/sửa/xóa mốc khấu trừ."""

from typing import Any

from rest_framework import serializers

from app.finance.serializers.responses.platform_tax_rate_response_serializer import (
    PlatformTaxRateResponseSerializer,
)


class PlatformTaxRateMutationResponseSerializer(serializers.Serializer[Any]):
    """Mốc + giao dịch có % đang chụp khác lịch sử mới (FE hỏi có tính lại không)."""

    entry = PlatformTaxRateResponseSerializer(allow_null=True, help_text="Mốc (null khi xóa).")
    affected_income_ids = serializers.ListField(
        child=serializers.UUIDField(), help_text="Giao dịch bị ảnh hưởng."
    )
