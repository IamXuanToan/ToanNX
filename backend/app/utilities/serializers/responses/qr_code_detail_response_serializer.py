"""Response chi tiết mã QR."""

from rest_framework import serializers

from app.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.utilities.models.qr_code import QrCode


class QrCodeDetailResponseSerializer(serializers.ModelSerializer[QrCode]):
    """Đủ dữ liệu cho form sửa và nút tải ảnh."""

    image = AttachmentSummaryResponseSerializer(help_text="Ảnh PNG trong Thư viện (id giữ nguyên khi sửa).")
    logo = AttachmentSummaryResponseSerializer(allow_null=True, help_text="Ảnh logo đã chọn, nếu có.")

    class Meta:
        model = QrCode
        fields = (
            "id",
            "owner_id",
            "name",
            "qr_type",
            "content",
            "design",
            "payload",
            "image",
            "logo",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
