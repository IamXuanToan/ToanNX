"""Response một dòng của danh sách mã QR."""

from rest_framework import serializers

from app.modules.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.modules.qr_codes.models.qr_code import QrCode
from app.modules.qr_codes.serializers.responses.qr_code_owner_response_serializer import (
    QrCodeOwnerResponseSerializer,
)


class QrCodeListResponseSerializer(serializers.ModelSerializer[QrCode]):
    """Ảnh nhỏ, tên, loại, owner, thời điểm."""

    image = AttachmentSummaryResponseSerializer(help_text="Ảnh PNG trong Thư viện.")
    owner = QrCodeOwnerResponseSerializer(help_text="Chủ sở hữu.")

    class Meta:
        model = QrCode
        fields = ("id", "name", "qr_type", "image", "owner", "created_at", "updated_at")
        read_only_fields = fields
