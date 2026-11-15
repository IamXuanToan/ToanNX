"""Hợp đồng tên thư mục logic."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AttachmentFolderValidateSerializer(CoreValidateSerializer):
    """Tạo/đổi tên thư mục; không nhận đường dẫn filesystem."""

    name = serializers.CharField(
        max_length=150, allow_blank=False, help_text="Tên thư mục, tối đa 150 ký tự."
    )
    parent_id = serializers.UUIDField(required=False, allow_null=True, help_text="Thư mục cha; null là gốc.")
