"""File rút gọn (lồng trong response khác, ví dụ ảnh đại diện người dùng)."""

from rest_framework import serializers

from app.attachment.models.attachment import Attachment
from app.core.utils.url import build_absolute_url


class AttachmentSummaryResponseSerializer(serializers.ModelSerializer[Attachment]):
    """Id và URL truy cập file."""

    url = serializers.SerializerMethodField(
        help_text="URL tuyệt đối truy cập file (domain theo request hoặc của object storage)."
    )

    class Meta:
        model = Attachment
        fields: tuple[str, ...] = ("id", "url")

    def get_url(self, obj: Attachment) -> str:
        """URL tuyệt đối; frontend dùng trực tiếp, không cần nối domain.

        Args:
            obj: Attachment.

        Returns:
            URL tuyệt đối.
        """
        return build_absolute_url(str(obj.file.url))
