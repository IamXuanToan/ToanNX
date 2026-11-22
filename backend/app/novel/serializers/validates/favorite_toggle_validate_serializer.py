"""Validate body POST /novel/favorites (bật/tắt yêu thích)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class FavoriteToggleValidateSerializer(CoreValidateSerializer):
    """Input bật/tắt yêu thích truyện."""

    novel_id = serializers.UUIDField(help_text="Mã truyện (UUID).")
