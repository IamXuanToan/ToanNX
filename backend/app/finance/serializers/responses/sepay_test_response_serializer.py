"""Response kiểm tra token SePay."""

from rest_framework import serializers


class SepayTestResponseSerializer(serializers.Serializer[dict[str, int]]):
    """Số tài khoản ngân hàng liên kết."""

    bank_account_count = serializers.IntegerField(help_text="Số tài khoản liên kết.")
