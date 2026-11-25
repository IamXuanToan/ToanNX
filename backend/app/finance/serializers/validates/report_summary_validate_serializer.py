"""Query báo cáo."""

from uuid import UUID

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.finance.utils.parse_uuid_list import parse_uuid_list

MIN_YEAR = 2000
MAX_YEAR = 2100
MONTHS = 12


class ReportSummaryValidateSerializer(CoreValidateSerializer):
    """Năm (+ tháng, người dùng)."""

    year = serializers.IntegerField(min_value=MIN_YEAR, max_value=MAX_YEAR, help_text="Năm.")
    month = serializers.IntegerField(
        min_value=1, max_value=MONTHS, required=False, allow_null=True, default=None, help_text="Tháng."
    )
    owner = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Lọc theo người dùng sở hữu (nhiều UUID phân tách dấu phẩy).",
    )

    def validate_owner(self, value: str) -> list[UUID]:
        """Parse danh sách UUID người dùng."""
        return parse_uuid_list(value)
