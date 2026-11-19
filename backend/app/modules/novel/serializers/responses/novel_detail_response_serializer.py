"""Serializer chi tiết truyện."""

from app.modules.novel.serializers.responses.novel_list_response_serializer import (
    NovelListResponseSerializer,
)


class NovelDetailResponseSerializer(NovelListResponseSerializer):
    """Thông tin chi tiết đầy đủ của truyện."""

    class Meta(NovelListResponseSerializer.Meta):
        fields: tuple[str, ...] = (*NovelListResponseSerializer.Meta.fields, "description", "owner_id")
