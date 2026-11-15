"""Response chi tiết mã QR."""

from rest_framework import serializers

from app.modules.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.modules.qr_codes.models.qr_code import QrCode


class QrCodeDetailResponseSerializer(serializers.ModelSerializer[QrCode]):
    """Đủ dữ liệu cho form sửa và nút tải ảnh."""

    image = AttachmentSummaryResponseSerializer(help_text="Ảnh PNG trong Thư viện (id giữ nguyên khi sửa).")

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
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
