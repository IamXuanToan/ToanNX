"""Kiểm tra URL http(s) do người dùng cung cấp."""

from urllib.parse import urlsplit

from app.core.exceptions.validation_error import ValidationError


def validate_public_url(value: str, field: str = "destination_url") -> str:
    """Chỉ nhận URL http(s) tuyệt đối, có host, không chứa credential hay control character."""
    if (
        not isinstance(value, str)
        or len(value) > 2048
        or any(ord(char) < 32 or ord(char) == 127 for char in value)
    ):
        raise ValidationError(details={field: ["URL không hợp lệ hoặc quá dài."]})
    try:
        parts = urlsplit(value)
        if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
            raise ValueError
        _ = parts.port
    except ValueError as exc:
        raise ValidationError(details={field: ["Chỉ chấp nhận URL http/https tuyệt đối."]}) from exc
    return value
