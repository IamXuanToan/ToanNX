"""Nhận diện lại."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class IncomeReclassifyValidateSerializer(CoreValidateSerializer):
    """Trống = mọi giao dịch chưa nhận diện."""

    ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list, help_text="Giao dịch."
    )
