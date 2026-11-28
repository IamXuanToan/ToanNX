"""Validate tạo mới Language."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class LanguageCreateValidateSerializer(CoreValidateSerializer):
    """Input tạo ngôn ngữ mới."""

    code = serializers.RegexField(regex=r"^[a-z]{2,10}(-[a-z0-9]{2,10})?$", max_length=16)
    name = serializers.CharField(max_length=100)
    native_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    flag_emoji = serializers.CharField(max_length=16, required=False, allow_blank=True, default="")
    is_active = serializers.BooleanField(required=False, default=True)
    sort_order = serializers.IntegerField(min_value=0, max_value=9999, required=False, default=10)
