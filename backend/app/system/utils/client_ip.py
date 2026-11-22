"""Lấy IP client thực tế từ request, an toàn trước proxy và chống giả mạo IP."""

import ipaddress

from django.http import HttpRequest

from app.system.constants.cloudflare_ip_ranges import (
    CLOUDFLARE_IPV4_CIDRS,
    CLOUDFLARE_IPV6_CIDRS,
)

IPNetwork = ipaddress.IPv4Network | ipaddress.IPv6Network
IPAddress = ipaddress.IPv4Address | ipaddress.IPv6Address

# Khởi tạo trước các dải mạng Cloudflare để tối ưu hiệu năng đối chiếu
_CLOUDFLARE_NETWORKS: tuple[IPNetwork, ...] = tuple(
    ipaddress.ip_network(cidr) for cidr in (*CLOUDFLARE_IPV4_CIDRS, *CLOUDFLARE_IPV6_CIDRS)
)


def _is_trusted_proxy(addr: IPAddress) -> bool:
    """Kiểm tra địa chỉ IP có phải là proxy tin cậy (nội bộ hoặc Cloudflare) hay không.

    Args:
        addr: Đối tượng IP cần kiểm tra.

    Returns:
        True nếu là private, loopback, link-local, reserved hoặc thuộc Cloudflare.
    """
    if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_unspecified or addr.is_reserved:
        return True
    return any(addr in network for network in _CLOUDFLARE_NETWORKS)


def get_client_ip(request: HttpRequest) -> str:
    """Lấy IP thực tế của client từ request.

    Áp dụng thuật toán duyệt ngược từ phải sang trái (right-to-left) trên chuỗi
    `X-Forwarded-For` để loại bỏ các hop proxy tin cậy (Cloudflare và mạng nội bộ).
    IP công khai đầu tiên tính từ phải qua trái không thuộc danh sách proxy tin cậy
    chính là IP thực của client, bảo đảm chống 100% IP spoofing.

    Nếu toàn bộ chuỗi đều là proxy tin cậy hoặc không có `X-Forwarded-For`, hàm
    sẽ sử dụng `CF-Connecting-IP` (nếu hợp lệ) hoặc fallback về `REMOTE_ADDR`.

    Args:
        request: HTTP request.

    Returns:
        Chuỗi IP client (chuẩn hóa IPv4 hoặc IPv6, hoặc rỗng nếu không xác định).
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    raw_ips: list[str] = []
    if forwarded:
        raw_ips = [part.strip() for part in forwarded.split(",") if part.strip()]
        for raw_ip in reversed(raw_ips):
            try:
                addr = ipaddress.ip_address(raw_ip)
            except ValueError:
                continue
            if not _is_trusted_proxy(addr):
                return str(addr)

    # Nếu có header CF-Connecting-IP từ Cloudflare
    cf_connecting_ip = str(request.META.get("HTTP_CF_CONNECTING_IP", "")).strip()
    if cf_connecting_ip:
        try:
            cf_addr = ipaddress.ip_address(cf_connecting_ip)
            if not _is_trusted_proxy(cf_addr):
                return str(cf_addr)
        except ValueError:
            pass

    # Nếu chuỗi X-Forwarded-For toàn IP private (môi trường thử nghiệm / mạng nội bộ)
    if raw_ips:
        for raw_ip in raw_ips:
            try:
                addr = ipaddress.ip_address(raw_ip)
                return str(addr)
            except ValueError:
                continue

    return str(request.META.get("REMOTE_ADDR", "")).strip()
