"""Hợp đồng chuyển file sang nhóm logic khác."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AttachmentUpdateValidateSerializer(CoreValidateSerializer):
    """Chỉ nhận folder_id; không mở quyền thay nội dung hoặc đường dẫn file."""

    folder_id = serializers.UUIDField(
        allow_null=True, help_text="Thư mục đích; null để đưa về chưa phân loại."
    )
