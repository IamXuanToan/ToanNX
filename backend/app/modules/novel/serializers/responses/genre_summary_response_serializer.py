"""Serializer thông tin tóm tắt thể loại."""

from rest_framework import serializers

from app.modules.novel.models.genre import Genre


class GenreSummaryResponseSerializer(serializers.ModelSerializer[Genre]):
    """Thông tin tóm tắt thể loại."""

    class Meta:
        model = Genre
        fields: tuple[str, ...] = ("id", "name", "slug", "description")
