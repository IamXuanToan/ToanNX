"""Validate body POST /attachments (multipart/form-data)."""

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.models.attachment import Attachment


class AttachmentUploadValidateSerializer(CoreValidateSerializer):
    """Một file, tối đa `ATTACHMENT_MAX_SIZE_BYTES`. Định dạng được service kiểm tra bằng chữ ký file."""

    folder_id = serializers.UUIDField(
        required=False, allow_null=True, help_text="Nhóm logic tùy chọn; không đổi nơi lưu file."
    )
    alt_text = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=255,
        help_text="Văn bản thay thế (alt) cho ảnh.",
    )

    visibility = serializers.ChoiceField(
        choices=Attachment.Visibility.choices,
        required=False,
        help_text="public/private; không gửi thì CSV, XLSX, XML là private, loại khác là public.",
    )
    file = serializers.FileField(
        allow_empty_file=False,
        help_text="File upload: PNG, JPEG, WEBP, GIF, SVG an toàn, PDF, XLSX, CSV, XML, MP4, MOV hoặc WEBM.",
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
