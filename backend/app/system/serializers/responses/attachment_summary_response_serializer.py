"""File rút gọn (lồng trong response khác, ví dụ ảnh đại diện người dùng)."""

from rest_framework import serializers

from app.core.utils.url import build_absolute_url
from app.system.models.attachment import Attachment

# Đường dẫn API mở nội dung file (đi qua kiểm quyền), dùng cho file riêng tư.
ATTACHMENT_CONTENT_PATH = "/api/v1/system/attachments/{id}/content"


class AttachmentSummaryResponseSerializer(serializers.ModelSerializer[Attachment]):
    """Id, chế độ xem và URL truy cập file."""

    url = serializers.SerializerMethodField(
        help_text=(
            "URL tuyệt đối mở file. Công khai: URL trực tiếp của storage. Riêng tư: URL API "
            "`/attachments/{id}/content` (cần đăng nhập và quyền; không có URL trực tiếp)."
        )
    )
    visibility = serializers.ChoiceField(
        choices=Attachment.Visibility.choices,
        read_only=True,
        help_text="public: ai có link đều xem; private: chỉ người upload, superuser, quyền xem riêng tư.",
    )

    class Meta:
        model = Attachment
        fields: tuple[str, ...] = ("id", "url", "visibility")

    def get_url(self, obj: Attachment) -> str:
        """URL tuyệt đối; frontend dùng trực tiếp, không cần nối domain.

        Args:
            obj: Attachment.

        Returns:
            URL tuyệt đối.
        """
        if obj.is_private:
            return build_absolute_url(ATTACHMENT_CONTENT_PATH.format(id=obj.pk))
        return build_absolute_url(str(obj.file.url))
