"""Thử nội dung với quy tắc."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class RuleTestValidateSerializer(CoreValidateSerializer):
    """Có `pattern` thì chỉ thử regex đó; không có thì chạy mọi quy tắc của mình."""

    content = serializers.CharField(max_length=1000, help_text="Nội dung chuyển khoản.")
    pattern = serializers.CharField(
        max_length=500, required=False, allow_blank=True, help_text="Regex muốn thử."
    )
