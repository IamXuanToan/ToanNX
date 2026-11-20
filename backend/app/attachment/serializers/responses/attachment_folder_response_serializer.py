"""Thông tin thư mục trong thư viện."""

from rest_framework import serializers

from app.attachment.models.attachment_folder import AttachmentFolder


class AttachmentFolderResponseSerializer(serializers.ModelSerializer[AttachmentFolder]):
    """Số file được repository annotate, không truy vấn trong serializer."""

    file_count = serializers.IntegerField(read_only=True, default=0, help_text="Số file chưa xóa trong nhóm.")
    created_by_id = serializers.UUIDField(read_only=True, allow_null=True, help_text="Chủ thư mục.")
    parent_id = serializers.UUIDField(read_only=True, allow_null=True, help_text="ID thư mục cha.")

    class Meta:
        model = AttachmentFolder
        fields = ("id", "name", "parent_id", "file_count", "created_by_id", "created_at")
