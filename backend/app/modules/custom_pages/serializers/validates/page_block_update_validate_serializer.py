"""Validate sửa block."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.custom_pages.models.page_block import PageBlock


class PageBlockUpdateValidateSerializer(CoreValidateSerializer):
    """Các trường được phép sửa của block."""

    block_type = serializers.ChoiceField(
        required=False, choices=PageBlock.Type.choices, help_text="Loại block mới."
    )
    content = serializers.JSONField(required=False, help_text="Nội dung theo loại block.")
    is_visible = serializers.BooleanField(required=False, help_text="Cờ hiển thị.")
