"""Serializer thông tin tóm tắt thẻ / hashtag."""

from rest_framework import serializers

from app.modules.novel.models.tag import Tag


class TagSummaryResponseSerializer(serializers.ModelSerializer[Tag]):
    """Thông tin tóm tắt thẻ."""

    class Meta:
        model = Tag
        fields: tuple[str, ...] = ("id", "name", "slug")
