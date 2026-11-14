"""Validate body POST /attachments (multipart/form-data)."""

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AttachmentUploadValidateSerializer(CoreValidateSerializer):
    """Một file, tối đa `ATTACHMENT_MAX_SIZE_BYTES`. Định dạng được service kiểm tra bằng chữ ký file."""

    file = serializers.FileField(
        allow_empty_file=False,
        help_text="File upload (multipart field `file`); định dạng: PNG, JPEG, WEBP, GIF, PDF.",
    )

    def validate_file(self, value: UploadedFile) -> UploadedFile:
        """Giới hạn dung lượng.

        Args:
            value: File upload.

        Returns:
            File hợp lệ.

        Raises:
            serializers.ValidationError: File quá lớn.
        """
        limit = settings.ATTACHMENT_MAX_SIZE_BYTES
        if (value.size or 0) > limit:
            raise serializers.ValidationError(f"Dung lượng tối đa {limit // (1024 * 1024)} MB.")
        return value
