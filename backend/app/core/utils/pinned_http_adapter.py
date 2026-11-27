"""HTTPAdapter ghim IP đã kiểm định để ngăn DNS Rebinding (TOCTOU SSRF)."""

from typing import Any
from urllib.parse import urlsplit

from requests import PreparedRequest
from requests.adapters import HTTPAdapter
from urllib3 import HTTPConnectionPool


class PinnedHttpAdapter(HTTPAdapter):
    """Ép kết nối TCP/TLS đi tới đúng IP đã xác thực thay vì phân giải DNS lại lần hai."""

    def __init__(self, pinned_ips: dict[str, str], **kwargs: Any) -> None:
        """Khởi tạo adapter với bảng ánh xạ hostname -> IP công cộng đã kiểm tra."""
        self.pinned_ips = pinned_ips
        super().__init__(**kwargs)

    def get_connection_with_tls_context(
        self,
        request: PreparedRequest,
        verify: Any,
        proxies: dict[str, str] | None = None,
        cert: Any = None,
    ) -> HTTPConnectionPool:
        """Ghi đè bước chọn connection pool để nối thẳng IP đã ghim và giữ nguyên SNI/xác thực cert."""
        pool = super().get_connection_with_tls_context(request, verify, proxies=None, cert=cert)
        if not request.url:
            return pool

        parts = urlsplit(request.url)
        hostname = (parts.hostname or "").lower()
        pinned_ip = self.pinned_ips.get(hostname)
        if not pinned_ip:
            return pool

        if parts.netloc and "Host" not in request.headers:
            request.headers["Host"] = parts.netloc

        _, pool_kwargs = self.build_connection_pool_key_attributes(request, verify, cert)
        if parts.scheme == "https":
            pool_kwargs["assert_hostname"] = hostname
            pool_kwargs["server_hostname"] = hostname

        return self.poolmanager.connection_from_host(
            host=pinned_ip,
            port=parts.port or (443 if parts.scheme == "https" else 80),
            scheme=parts.scheme or "http",
            pool_kwargs=pool_kwargs,
        )
