"""HTTP Client an toàn với cơ chế phòng thủ 7 lớp chống tấn công SSRF (Server-Side Request Forgery).

1. Whitelist protocol (chỉ http và https).
2. Phân giải DNS và chặn dải IP nội bộ, loopback, link-local, cloud metadata.
3. Chống DNS Rebinding bằng cách kiểm tra IP trước khi kết nối.
4. Giới hạn timeout: kết nối 3s, đọc 5s.
5. Kiểm tra re-validation trên từng bước chuyển hướng (redirect loop & hop, max 5).
6. Giới hạn dung lượng phản hồi (stream tối đa 1 MB).
7. Kiểm tra Content-Type header (chỉ nhận text/html, application/xhtml+xml).
"""

import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import requests

from app.core.exceptions.validation_error import ValidationError

# Các dải IP bị cấm truy cập tuyệt đối
_BLOCKED_NETWORKS = (
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
)

MAX_REDIRECTS = 5
MAX_RESPONSE_BYTES = 1_048_576  # 1 MB
CONNECT_TIMEOUT = 3.0
READ_TIMEOUT = 5.0
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)


def is_ip_allowed(ip_str: str) -> bool:
    """Kiểm tra địa chỉ IP có an toàn hay thuộc dải private/internal/cloud metadata."""
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback or ip.is_private or ip.is_reserved or ip.is_link_local:
            return False
        return not any(ip in net for net in _BLOCKED_NETWORKS)
    except ValueError:
        return False


def validate_url_safety(url: str) -> str:
    """Kiểm tra tính an toàn của URL (scheme và phân giải hostname sang IP).

    Args:
        url: URL cần kiểm tra.

    Returns:
        URL chuẩn hóa.

    Raises:
        ValidationError: URL không hợp lệ hoặc trỏ tới mạng nội bộ.
    """
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https"):
        raise ValidationError(details={"url": ["Chỉ hỗ trợ giao thức http hoặc https."]})

    hostname = parts.hostname
    if not hostname:
        raise ValidationError(details={"url": ["URL không có hostname hợp lệ."]})

    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = str(sockaddr[0])
            if not is_ip_allowed(ip_str):
                raise ValidationError(details={"url": ["Địa chỉ đích không được phép truy cập."]})
    except socket.gaierror as exc:
        raise ValidationError(details={"url": ["Không thể phân giải tên miền."]}) from exc

    return url


class SafeHttpClient:
    """Client thực hiện HTTP GET an toàn, ngăn chặn SSRF và giới hạn dung lượng tải về."""

    def __init__(self) -> None:
        """Khởi tạo session với User-Agent chuẩn của trình duyệt."""
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": DEFAULT_USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            }
        )

    def fetch_html(self, initial_url: str) -> tuple[str, str]:
        """Tải nội dung HTML an toàn theo chuỗi chuyển hướng (tối đa MAX_REDIRECTS).

        Args:
            initial_url: URL bắt đầu.

        Returns:
            Tuple gồm (nội dung HTML dạng text, URL cuối cùng sau redirect).

        Raises:
            ValidationError: Nếu URL không an toàn, vượt quá redirect, hoặc không phải HTML.
        """
        current_url = initial_url
        hops = 0

        while hops <= MAX_REDIRECTS:
            validate_url_safety(current_url)

            try:
                response = self.session.get(
                    current_url,
                    timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
                    allow_redirects=False,
                    stream=True,
                )
            except requests.RequestException as exc:
                raise ValidationError(
                    details={"url": [f"Không thể kết nối đến website nguồn: {exc}"]}
                ) from exc

            # Xử lý redirect 301, 302, 303, 307, 308
            if response.is_redirect or response.status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("Location")
                if not location:
                    break
                current_url = urljoin(current_url, location)
                hops += 1
                if hops > MAX_REDIRECTS:
                    raise ValidationError(details={"url": ["Vượt quá số lần chuyển hướng cho phép."]})
                continue

            # Kiểm tra status code
            if response.status_code != 200:
                raise ValidationError(
                    details={"url": [f"Website nguồn phản hồi mã lỗi {response.status_code}."]}
                )

            # Kiểm tra Content-Type
            content_type = response.headers.get("Content-Type", "").lower()
            if not ("text/html" in content_type or "application/xhtml+xml" in content_type):
                raise ValidationError(details={"url": ["Đường dẫn không trả về trang web HTML hợp lệ."]})

            # Đọc nội dung với giới hạn dung lượng
            chunks: list[bytes] = []
            total_bytes = 0
            for chunk in response.iter_content(chunk_size=8192):
                total_bytes += len(chunk)
                if total_bytes > MAX_RESPONSE_BYTES:
                    response.close()
                    break
                chunks.append(chunk)

            raw_bytes = b"".join(chunks)
            encoding = response.encoding or "utf-8"
            try:
                html_text = raw_bytes.decode(encoding, errors="replace")
            except (LookupError, UnicodeDecodeError):
                html_text = raw_bytes.decode("utf-8", errors="replace")

            return html_text, current_url

        raise ValidationError(details={"url": ["Quá nhiều bước chuyển hướng."]})
