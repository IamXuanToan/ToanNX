"""URL đích sau khi kiểm mật khẩu liên kết."""

from typing import Any

from rest_framework import serializers


class ShortLinkDestinationResponseSerializer(serializers.Serializer[Any]):
    """Dữ liệu tối thiểu trả về sau khi mở khóa."""

    destination_url = serializers.URLField(help_text="URL HTTP/HTTPS đích đã được kiểm tra.")
