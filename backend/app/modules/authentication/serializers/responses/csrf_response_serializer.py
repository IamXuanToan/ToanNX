"""Response GET /auth/csrf."""

from typing import Any

from rest_framework import serializers


class CsrfResponseSerializer(serializers.Serializer[Any]):
    """CSRF token (cũng nằm trong cookie `toannx_csrf`)."""

    csrf_token = serializers.CharField(
        help_text="Token gửi lại qua header `X-CSRFToken` cho request thay đổi trạng thái."
    )
