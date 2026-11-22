"""Bộ lọc mã QR: `?qr_type=BANK_TRANSFER,URL&owner=<uuid>`."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.utilities.models.qr_code import QrCode


class QrCodeFilter(django_filters.FilterSet):
    """Loại và chủ sở hữu (chủ sở hữu chỉ có tác dụng với manage_all)."""

    qr_type = CoreChoiceInFilter(choices=QrCode.Type.choices, help_text="Loại, nhiều giá trị.")
    owner = CoreUUIDInFilter(field_name="owner_id", help_text="Id chủ sở hữu, nhiều giá trị.")

    class Meta:
        model = QrCode
        fields = ("qr_type", "owner")
