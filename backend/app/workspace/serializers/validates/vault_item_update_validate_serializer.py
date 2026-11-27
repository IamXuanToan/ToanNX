"""Validate cập nhật Mục Két sắt Bí mật (bỏ trống `secret` sẽ giữ nguyên bí mật cũ)."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.vault_item import VaultItem


class VaultItemUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH mục Két sắt."""

    title = serializers.CharField(max_length=200, required=False, help_text="Tiêu đề mục bí mật.")
    category = serializers.ChoiceField(
        choices=VaultItem.Category.choices, required=False, help_text="Phân loại mục bí mật."
    )
    username = serializers.CharField(
        max_length=200, required=False, allow_blank=True, help_text="Tên đăng nhập."
    )
    secret = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=10000,
        trim_whitespace=False,
        help_text="Bí mật mới (bỏ trống để giữ nguyên bí mật hiện tại).",
    )
    url = serializers.CharField(max_length=500, required=False, allow_blank=True, help_text="URL liên quan.")
    notes = serializers.CharField(required=False, allow_blank=True, help_text="Ghi chú bổ sung.")
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50), required=False, help_text="Danh sách thẻ."
    )
