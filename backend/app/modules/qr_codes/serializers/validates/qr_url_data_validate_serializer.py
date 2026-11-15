"""Dữ liệu mã QR liên kết."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.core.utils.url import validate_public_url


class QrUrlDataValidateSerializer(CoreValidateSerializer):
    """URL http/https tuyệt đối (có thể là link rút gọn `toannx.com/s/...`)."""

    url = serializers.CharField(max_length=2048, help_text="URL http/https.")

    def validate_url(self, value: str) -> str:
        """Chỉ URL http(s) tuyệt đối, không credential."""
        return validate_public_url(value, field="url")
