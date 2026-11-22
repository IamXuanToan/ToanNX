"""Validate body POST /attachments/{id}/visibility."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.models.attachment import Attachment


class AttachmentVisibilityValidateSerializer(CoreValidateSerializer):
    """Chế độ xem mới của file."""

    visibility = serializers.ChoiceField(
        choices=Attachment.Visibility.choices,
        help_text="public: chuyển sang kho công khai; private: chuyển sang kho riêng tư.",
    )
