"""Validate thêm block."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.custom_pages.models.page_block import PageBlock


class PageBlockCreateValidateSerializer(CoreValidateSerializer):
    """Input tạo block; vị trí được service gán ở cuối trang."""

    block_type = serializers.ChoiceField(choices=PageBlock.Type.choices, help_text="Loại block.")
    content = serializers.JSONField(help_text="Nội dung riêng của block_type.")
    is_visible = serializers.BooleanField(required=False, help_text="Hiển thị công khai; mặc định true.")
