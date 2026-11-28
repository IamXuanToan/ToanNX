"""Response ô nhập trực tiếp cho câu hỏi lựa chọn của Trợ lý AI."""

from typing import Any

from rest_framework import serializers


class AssistantQuickInputResponseSerializer(serializers.Serializer[Any]):
    """Kiểu ô nhập (`number` / `text` / `secret`), đơn vị hiển thị và gợi ý."""

    kind = serializers.ChoiceField(choices=("number", "text", "secret"), help_text="Kiểu ô nhập.")
    unit = serializers.CharField(
        allow_blank=True, help_text="Đơn vị gắn sau số (VD `phút`), rỗng nếu không có."
    )
    placeholder = serializers.CharField(help_text="Gợi ý hiển thị trong ô nhập.")
