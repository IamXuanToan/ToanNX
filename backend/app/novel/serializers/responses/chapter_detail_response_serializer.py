"""Serializer chi tiết chương truyện (kèm nội dung)."""

from rest_framework import serializers

from app.novel.serializers.responses.chapter_list_response_serializer import (
    ChapterListResponseSerializer,
)


class ChapterDetailResponseSerializer(ChapterListResponseSerializer):
    """Chi tiết chương truyện: kèm nội dung văn bản và số chương liền kề."""

    content = serializers.CharField(help_text="Nội dung văn bản chương truyện.")
    prev_chapter_number = serializers.IntegerField(
        allow_null=True, required=False, help_text="Số thứ tự chương trước đó."
    )
    next_chapter_number = serializers.IntegerField(
        allow_null=True, required=False, help_text="Số thứ tự chương tiếp theo."
    )
    novel_title = serializers.CharField(source="novel.title", read_only=True, help_text="Tên bộ truyện.")
    novel_slug = serializers.CharField(source="novel.slug", read_only=True, help_text="Slug bộ truyện.")

    class Meta(ChapterListResponseSerializer.Meta):
        fields: tuple[str, ...] = (
            *ChapterListResponseSerializer.Meta.fields,
            "content",
            "prev_chapter_number",
            "next_chapter_number",
            "novel_title",
            "novel_slug",
        )
