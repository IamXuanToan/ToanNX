"""Response GET /qr_codes/banks."""

from typing import Any

from rest_framework import serializers


class QrBankResponseSerializer(serializers.Serializer[Any]):
    """Một ngân hàng nhận VietQR."""

    bin = serializers.CharField(help_text="BIN (gửi vào `content.bank_bin`).")
    code = serializers.CharField(help_text="Mã ngắn.")
    short_name = serializers.CharField(help_text="Tên ngắn.")
    name = serializers.CharField(help_text="Tên đầy đủ.")
