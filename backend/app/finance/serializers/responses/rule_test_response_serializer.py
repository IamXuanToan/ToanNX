"""Response thử nội dung với quy tắc."""

from typing import Any

from rest_framework import serializers


class RuleTestResponseSerializer(serializers.Serializer[Any]):
    """Nội dung chuẩn hóa, quy tắc khớp (nếu chạy mọi quy tắc), đoạn khớp."""

    normalized = serializers.CharField(help_text="Nội dung đã bỏ dấu, viết hoa.")
    rule_id = serializers.UUIDField(
        source="rule.pk", allow_null=True, default=None, help_text="Quy tắc khớp."
    )
    rule_name = serializers.CharField(
        source="rule.name", allow_null=True, default=None, help_text="Tên quy tắc."
    )
    platform_name = serializers.CharField(
        source="rule.platform.name", allow_null=True, default=None, help_text="Nền tảng."
    )
    matched_text = serializers.CharField(allow_null=True, help_text="Đoạn khớp.")
