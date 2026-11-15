"""Dữ liệu mã QR văn bản."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class QrTextDataValidateSerializer(CoreValidateSerializer):
    """Văn bản tự do."""

    text = serializers.CharField(max_length=1000, help_text="Nội dung, tối đa 1000 ký tự.")
