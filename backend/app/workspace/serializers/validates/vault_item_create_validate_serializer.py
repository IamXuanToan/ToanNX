"""Validate tạo mới Mục Két sắt Bí mật."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.workspace.models.vault_item import VaultItem


class VaultItemCreateValidateSerializer(CoreValidateSerializer):
    """Đầu vào tạo mục Két sắt (nhận `secret` bản rõ một lần rồi mã hóa Fernet)."""

    title = serializers.CharField(max_length=200, help_text="Tiêu đề gợi nhớ mục bí mật.")
    category = serializers.ChoiceField(
        choices=VaultItem.Category.choices,
        required=False,
        default=VaultItem.Category.ACCOUNT,
        help_text="Phân loại mục bí mật.",
    )
    username = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default="", help_text="Tên đăng nhập / Prefix."
    )
    secret = serializers.CharField(
        min_length=1, max_length=10000, trim_whitespace=False, help_text="Chuỗi bí mật cần mã hóa."
    )
    url = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default="", help_text="URL liên quan."
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="", help_text="Ghi chú bổ sung.")
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
        help_text="Danh sách thẻ phân loại.",
    )
