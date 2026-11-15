"""Mô tả CookieJwtAuthentication trong OpenAPI (drf-spectacular extension)."""

from typing import Any

from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.openapi import AutoSchema


class CookieJwtAuthenticationScheme(OpenApiAuthenticationExtension):
    """Access JWT qua cookie `access_token` (kèm CSRF) hoặc header `Authorization: Bearer`.

    Hai cách là lựa chọn thay thế (OR), không bắt buộc cả hai.
    Được nạp trong `AuthenticationConfig.ready()` để tự đăng ký.
    """

    target_class = (
        "app.modules.authentication.authentications.cookie_jwt_authentication.CookieJwtAuthentication"
    )
    name = ["cookieJwt", "bearerJwt"]

    def get_security_requirement(self, auto_schema: AutoSchema) -> list[dict[str, list[Any]]]:
        """Cookie hoặc Bearer (OR).

        Args:
            auto_schema: AutoSchema của view.

        Returns:
            Danh sách security requirement thay thế nhau.
        """
        return [{"cookieJwt": []}, {"bearerJwt": []}]

    def get_security_definition(self, auto_schema: AutoSchema) -> list[dict[str, Any]]:
        """Định nghĩa hai security scheme.

        Args:
            auto_schema: AutoSchema của view.

        Returns:
            Security scheme theo thứ tự của `name`.
        """
        return [
            {
                "type": "apiKey",
                "in": "cookie",
                "name": settings.AUTH_ACCESS_COOKIE_NAME,
                "description": "Access JWT trong cookie HttpOnly; request ghi cần header CSRF.",
            },
            {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Access JWT qua header Authorization (không cần CSRF).",
            },
        ]
