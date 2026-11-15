"""Lựa chọn xử lý file khi xóa nhánh thư mục."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AttachmentFolderDeleteValidateSerializer(CoreValidateSerializer):
    """Mặc định giữ file và bỏ phân loại."""

    delete_files = serializers.BooleanField(default=False, help_text="Xóa mềm file trong cả nhánh.")
