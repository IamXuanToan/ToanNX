"""Response giải mã bí mật `POST /workspace/vault-items/{id}/reveal`."""

from typing import Any

from rest_framework import serializers


class VaultItemRevealResponseSerializer(serializers.Serializer[Any]):
    """Trả bản rõ bí mật một lần kèm thời điểm và người mở xem."""

    id = serializers.UUIDField(help_text="ID mục két sắt.")
    title = serializers.CharField(help_text="Tiêu đề mục két sắt.")
    username = serializers.CharField(allow_blank=True, help_text="Tên tài khoản.")
    secret = serializers.CharField(help_text="Chuỗi bí mật đã giải mã.")
    url = serializers.CharField(allow_blank=True, help_text="URL liên quan.")
    revealed_at = serializers.DateTimeField(help_text="Thời điểm giải mã.")
    revealed_by_email = serializers.CharField(allow_blank=True, help_text="Người thực hiện giải mã.")
