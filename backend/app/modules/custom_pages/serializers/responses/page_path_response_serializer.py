"""Response đường dẫn giữa (danh sách và chi tiết dùng chung một hình dạng)."""

from rest_framework import serializers

from app.modules.custom_pages.models.page_path import PagePath


class PagePathResponseSerializer(serializers.ModelSerializer[PagePath]):
    """Segment, tên, mô tả, bật, thứ tự, số trang."""

    page_count = serializers.IntegerField(read_only=True, help_text="Số trang còn tồn tại.")

    class Meta:
        model = PagePath
        fields = (
            "id",
            "segment",
            "name",
            "description",
            "is_active",
            "position",
            "page_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
