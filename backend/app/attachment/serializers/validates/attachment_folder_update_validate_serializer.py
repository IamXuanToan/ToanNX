"""Contract cập nhật từng phần thư mục."""

from rest_framework import serializers

from app.attachment.serializers.validates.attachment_folder_validate_serializer import (
    AttachmentFolderValidateSerializer,
)


class AttachmentFolderUpdateValidateSerializer(AttachmentFolderValidateSerializer):
    """Cho phép chỉ đổi cha hoặc chỉ đổi tên, không bỏ qua kiểm tra tên rỗng."""

    name = serializers.CharField(
        required=False, max_length=150, allow_blank=False, help_text="Tên mới, tối đa 150 ký tự."
    )
