"""Dựng URL tuyệt đối theo domain của request hiện tại.

Domain lấy từ request (sau proxy: `X-Forwarded-Host` / `X-Forwarded-Proto`, xem
`USE_X_FORWARDED_HOST`, `SECURE_PROXY_SSL_HEADER` trong settings), nên frontend nhận
URL dùng được ngay, không phải tự nối domain. URL đã tuyệt đối (object storage) giữ nguyên.
"""

from app.core.context.user_context import get_current_request


def build_absolute_url(url: str) -> str:
    """Biến đường dẫn tương đối (ví dụ `/media/...`) thành URL tuyệt đối.

    Args:
        url: URL tương đối hoặc tuyệt đối.

    Returns:
        URL tuyệt đối; ngoài request (shell, command) trả nguyên giá trị vào.
    """
    if not url or "://" in url:
        return url
    request = get_current_request()
    if request is None:
        return url
    return str(request.build_absolute_uri(url))
