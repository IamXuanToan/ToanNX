"""Response tạo nền tảng mẫu."""

from rest_framework import serializers


class PlatformSeedResponseSerializer(serializers.Serializer[dict[str, int]]):
    """Số nền tảng mới tạo."""

    created = serializers.IntegerField(help_text="Số nền tảng mới tạo.")
