"""Validate ghi nhận lịch sử đọc chương."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ReadingHistoryRecordValidateSerializer(CoreValidateSerializer):
    """Input ghi nhận lịch sử đã đọc một chương."""

    novel_id = serializers.UUIDField(help_text="Mã truyện (UUID).")
    chapter_id = serializers.UUIDField(help_text="Mã chương đã đọc (UUID).")
