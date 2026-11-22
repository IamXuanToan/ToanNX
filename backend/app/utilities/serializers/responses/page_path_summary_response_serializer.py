"""Đường dẫn giữa rút gọn lồng trong response trang."""

from rest_framework import serializers

from app.utilities.models.page_path import PagePath


class PagePathSummaryResponseSerializer(serializers.ModelSerializer[PagePath]):
    """Id, segment, tên."""

    class Meta:
        model = PagePath
        fields = ("id", "segment", "name")
        read_only_fields = fields
