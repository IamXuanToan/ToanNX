"""Hợp đồng cập nhật thông tin file: tên hiển thị, alt text, thư mục."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AttachmentUpdateValidateSerializer(CoreValidateSerializer):
    """Cập nhật thông tin file; không mở quyền thay nội dung hoặc đường dẫn file."""

    original_name = serializers.CharField(
        required=False,
        max_length=255,
        help_text="Tên hiển thị của file.",
    )
    alt_text = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        help_text="Văn bản thay thế (alt) cho ảnh phục vụ SEO & accessibility.",
    )
    folder_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Thư mục đích; null để đưa về chưa phân loại.",
    )
