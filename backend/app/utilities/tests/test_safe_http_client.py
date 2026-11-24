"""Kiểm thử bộ lọc SSRF và SafeHttpClient trong module Tiện ích."""

import pytest

from app.core.exceptions.validation_error import ValidationError
from app.utilities.utils.safe_http_client import is_ip_allowed, validate_url_safety


class TestSafeHttpClient:
    """Kiểm thử phòng vệ SSRF và kiểm tra tính an toàn của IP/URL."""

    def test_is_ip_allowed_blocks_private_and_loopback(self) -> None:
        """Chặn loopback, private IP LAN và cloud metadata."""
        assert is_ip_allowed("127.0.0.1") is False
        assert is_ip_allowed("127.0.0.2") is False
        assert is_ip_allowed("10.0.0.1") is False
        assert is_ip_allowed("172.16.0.1") is False
        assert is_ip_allowed("192.168.1.1") is False
        assert is_ip_allowed("169.254.169.254") is False
        assert is_ip_allowed("::1") is False

    def test_is_ip_allowed_accepts_public_ip(self) -> None:
        """Cho phép các địa chỉ IP công cộng an toàn (Cloudflare, Google DNS)."""
        assert is_ip_allowed("1.1.1.1") is True
        assert is_ip_allowed("8.8.8.8") is True

    def test_validate_url_safety_rejects_unsupported_scheme(self) -> None:
        """Chỉ cho phép http và https."""
        with pytest.raises(ValidationError):
            validate_url_safety("ftp://example.com/file.zip")
        with pytest.raises(ValidationError):
            validate_url_safety("file:///etc/passwd")

    def test_validate_url_safety_rejects_localhost(self) -> None:
        """Chặn localhost và 127.0.0.1."""
        with pytest.raises(ValidationError):
            validate_url_safety("http://localhost:8000/api")
        with pytest.raises(ValidationError):
            validate_url_safety("http://127.0.0.1:8000/api")
