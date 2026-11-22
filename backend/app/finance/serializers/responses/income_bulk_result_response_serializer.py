"""Response thao tác hàng loạt trên giao dịch."""

from rest_framework import serializers


class IncomeBulkResultResponseSerializer(serializers.Serializer[dict[str, int]]):
    """Số giao dịch đã đổi."""

    changed = serializers.IntegerField(help_text="Số giao dịch đã đổi.")
