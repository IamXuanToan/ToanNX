"""Serializer validate cho thao tác ẩn/hiện bình luận quyên góp."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class DonationToggleValidateSerializer(CoreValidateSerializer):
    """Đổi trạng thái ẩn/hiện bình luận."""

    is_hidden = serializers.BooleanField(required=True, help_text="Trạng thái ẩn (True) hoặc hiện (False).")
