"""Validate cập nhật Language."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class LanguageUpdateValidateSerializer(CoreValidateSerializer):
    """Input cập nhật từng phần ngôn ngữ."""

    code = serializers.RegexField(
        regex=r"^[a-z]{2,10}(-[a-z0-9]{2,10})?$",
        max_length=16,
        required=False,
    )
    name = serializers.CharField(max_length=100, required=False)
    native_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    flag_emoji = serializers.CharField(max_length=16, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    sort_order = serializers.IntegerField(min_value=0, max_value=9999, required=False)
