"""Kiểm thử hàm nhận diện IP client thực tế (get_client_ip)."""

from django.test import RequestFactory

from app.system.utils.client_ip import get_client_ip


def test_client_ip_direct_without_proxy() -> None:
    """Không có proxy: lấy REMOTE_ADDR."""
    factory = RequestFactory()
    request = factory.get("/", REMOTE_ADDR="127.0.0.1")
    assert get_client_ip(request) == "127.0.0.1"


def test_client_ip_empty_request() -> None:
    """Request không có IP trong header và REMOTE_ADDR rỗng: trả về chuỗi rỗng."""
    factory = RequestFactory()
    request = factory.get("/")
    request.META["REMOTE_ADDR"] = ""
    assert get_client_ip(request) == ""


def test_client_ip_prefers_cf_connecting_ip_over_intermediate_proxies() -> None:
    """Ưu tiên CF-Connecting-IP từ Cloudflare, bỏ qua IP trung gian của Vercel/AWS."""
    factory = RequestFactory()
    # 43.199.206.243 là IP Vercel Frontend trên AWS; 1.52.1.221 là IP thật của người dùng
    request = factory.get(
        "/",
        HTTP_CF_CONNECTING_IP="1.52.1.221",
        HTTP_X_FORWARDED_FOR="1.52.1.221, 162.159.98.210, 43.199.206.243",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "1.52.1.221"


def test_client_ip_single_cloudflare_proxy() -> None:
    """Request qua 1 lớp proxy Cloudflare (không có CF-Connecting-IP): lấy IP client thật."""
    factory = RequestFactory()
    request = factory.get(
        "/",
        HTTP_X_FORWARDED_FOR="113.190.45.12, 162.158.108.125",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "113.190.45.12"


def test_client_ip_multiple_cloudflare_and_private_proxies() -> None:
    """Request qua chuỗi proxy Cloudflare và mạng nội bộ: loại bỏ tất cả và lấy IP client thật."""
    factory = RequestFactory()
    # 162.159.98.210 thuộc 162.158.0.0/15 (Cloudflare)
    # 172.68.211.50 thuộc 172.64.0.0/13 (Cloudflare)
    # 10.0.1.20 thuộc dải private
    request = factory.get(
        "/",
        HTTP_X_FORWARDED_FOR="42.118.115.89, 10.0.1.20, 172.68.211.50, 162.159.98.210",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "42.118.115.89"


def test_client_ip_anti_spoofing_ignores_fake_ips() -> None:
    """Chống IP spoofing: client tự chèn IP giả bên trái không thể đánh lừa hệ thống."""
    factory = RequestFactory()
    # Kẻ xấu gửi 8.8.8.8, 1.1.1.1 giả mạo; Cloudflare gắn IP thật 14.232.208.5; Vercel gắn IP Cloudflare
    request = factory.get(
        "/",
        HTTP_X_FORWARDED_FOR="8.8.8.8, 1.1.1.1, 14.232.208.5, 162.159.98.210",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "14.232.208.5"


def test_client_ip_ipv6_support() -> None:
    """Hỗ trợ đầy đủ IPv6 cho cả client và proxy Cloudflare."""
    factory = RequestFactory()
    # 2606:4700:4700::1111 thuộc 2606:4700::/32 (Cloudflare IPv6)
    request = factory.get(
        "/",
        HTTP_X_FORWARDED_FOR="2405:4803:c800:10::5, 2606:4700:4700::1111",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "2405:4803:c800:10::5"


def test_client_ip_handles_invalid_format_and_whitespace() -> None:
    """Bỏ qua khoảng trắng và chuỗi không phải định dạng IP hợp lệ."""
    factory = RequestFactory()
    request = factory.get(
        "/",
        HTTP_X_FORWARDED_FOR="unknown,   , 115.79.20.10  , not_an_ip, 162.158.10.1 ",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "115.79.20.10"


def test_client_ip_all_private_intranet_fallback() -> None:
    """Trong môi trường mạng nội bộ hoàn toàn (toàn private IP): trả về IP đầu tiên."""
    factory = RequestFactory()
    request = factory.get(
        "/",
        HTTP_X_FORWARDED_FOR="192.168.1.100, 10.0.0.1",
        REMOTE_ADDR="127.0.0.1",
    )
    assert get_client_ip(request) == "192.168.1.100"
