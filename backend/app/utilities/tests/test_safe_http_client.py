"""Kiểm thử bộ lọc SSRF và SafeHttpClient trong module Tiện ích."""

from unittest.mock import patch

import pytest

from app.core.exceptions.validation_error import ValidationError
from app.utilities.utils.safe_http_client import SafeHttpClient, is_ip_allowed, validate_url_safety


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

    def test_is_ip_allowed_blocks_ipv4_mapped_and_special_ipv6(self) -> None:
        """Chặn IPv4-mapped IPv6, NAT64, CGNAT, 6to4, multicast và zone ID nội bộ."""
        for ip in (
            "::ffff:127.0.0.1",
            "::ffff:169.254.169.254",
            "::ffff:10.0.0.1",
            "64:ff9b::127.0.0.1",
            "2002:7f00:0001::",
            "100.64.0.1",
            "0.0.0.0",  # noqa: S104 - test case chặn unspecified IP
            "::",
            "ff02::1",
            "fe80::1%eth0",
        ):
            assert is_ip_allowed(ip) is False, f"Phải chặn IP nội bộ/đặc biệt {ip}"

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

    def test_safe_http_client_pins_resolved_ip_and_disables_env_proxy(self) -> None:
        """Client tắt env proxy và ghim đúng IP đã kiểm định khi thực thi GET chống DNS rebinding."""
        client = SafeHttpClient()
        assert client.session.trust_env is False

        with (
            patch(
                "app.utilities.utils.safe_http_client.socket.getaddrinfo",
                return_value=[(2, 1, 6, "", ("93.184.216.34", 0))],
            ),
            patch.object(client.session, "get") as mock_get,
        ):
            mock_resp = mock_get.return_value
            mock_resp.is_redirect = False
            mock_resp.status_code = 200
            mock_resp.headers = {"Content-Type": "text/html; charset=utf-8"}
            mock_resp.encoding = "utf-8"
            mock_resp.apparent_encoding = "utf-8"
            mock_resp.iter_content.return_value = [b"<title>Safe</title>"]

            html, final_url = client.fetch_html("https://example.com/page")

        assert "<title>Safe</title>" in html
        assert final_url == "https://example.com/page"
        assert client.pinned_ips["example.com"] == "93.184.216.34"

    def test_pinned_http_adapter_connects_to_pinned_ip_and_preserves_tls_sni(self) -> None:
        """PinnedHttpAdapter ép urllib3 nối thẳng IP đã xác thực và giữ SNI/assert_hostname cho HTTPS."""
        import requests

        from app.utilities.utils.pinned_http_adapter import PinnedHttpAdapter

        adapter = PinnedHttpAdapter({"example.com": "93.184.216.34"})
        prepared = requests.Request("GET", "https://example.com/hello").prepare()
        with patch.object(adapter.poolmanager, "connection_from_host") as mock_conn_from_host:
            adapter.get_connection_with_tls_context(prepared, verify=True)

        assert prepared.headers["Host"] == "example.com"
        _, kwargs = mock_conn_from_host.call_args
        assert kwargs["host"] == "93.184.216.34"
        assert kwargs["scheme"] == "https"
        assert kwargs["port"] == 443
        assert kwargs["pool_kwargs"]["assert_hostname"] == "example.com"
        assert kwargs["pool_kwargs"]["server_hostname"] == "example.com"
