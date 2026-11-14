"""Validate body PATCH /system/modules/{code}."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.core.validators.core_validator import ICON_NAME_PATTERN


class ModuleUpdateValidateSerializer(CoreValidateSerializer):
    """Bật/tắt module và/hoặc đổi icon (gửi ít nhất một field)."""

    enabled = serializers.BooleanField(required=False, help_text="true để bật, false để tắt module.")
    icon = serializers.RegexField(
        ICON_NAME_PATTERN,
        required=False,
        allow_blank=True,
        max_length=64,
        help_text="Tên icon lucide-react kebab-case (ví dụ `shield-check`); chuỗi rỗng = icon mặc định.",
    )
    icon_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Id attachment SVG (upload qua /attachments, chỉ nhận SVG); null để gỡ icon SVG.",
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Bắt buộc có ít nhất một field.

        Args:
            attrs: Dữ liệu đã validate từng field.

        Returns:
            Dữ liệu hợp lệ.

        Raises:
            serializers.ValidationError: Body rỗng.
        """
        if not attrs:
            raise serializers.ValidationError("Cần ít nhất một trong các field: enabled, icon, icon_id.")
        return attrs
