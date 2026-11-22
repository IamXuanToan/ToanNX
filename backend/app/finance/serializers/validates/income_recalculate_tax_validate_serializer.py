"""Tính lại khấu trừ theo lịch sử hiện tại."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class IncomeRecalculateTaxValidateSerializer(CoreValidateSerializer):
    """`reset_manual` = bỏ thuế tay rồi tính lại."""

    ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False, help_text="Giao dịch.")
    reset_manual = serializers.BooleanField(required=False, default=False, help_text="Bỏ thuế nhập tay.")
