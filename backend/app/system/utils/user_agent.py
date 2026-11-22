"""Đổi chuỗi User-Agent thành nhãn ngắn dễ đọc ("Chrome trên Windows") cho thông báo đăng nhập.

Chỉ nhận diện trình duyệt + hệ điều hành phổ biến bằng mẫu đơn giản (không thêm thư viện): đủ để người dùng
nhận ra thiết bị của mình trong popup/Telegram/email. Thứ tự mẫu quan trọng vì Edge/Opera/Cốc Cốc đều chứa
chữ "Chrome".
"""

import re

UNKNOWN_DEVICE = "Trình duyệt không rõ"

# (mẫu, tên) — trình duyệt nhân Chromium đặc thù phải đứng trước "Chrome".
BROWSERS: tuple[tuple[str, str], ...] = (
    (r"coc_coc_browser", "Cốc Cốc"),
    (r"Edg(?:e|A|iOS)?/", "Edge"),
    (r"OPR/|Opera", "Opera"),
    (r"SamsungBrowser/", "Samsung Internet"),
    (r"Firefox/|FxiOS/", "Firefox"),
    (r"CriOS/|Chrome/", "Chrome"),
    (r"Safari/", "Safari"),
)
SYSTEMS: tuple[tuple[str, str], ...] = (
    (r"iPhone|iPad|iPod", "iOS"),
    (r"Android", "Android"),
    (r"Windows", "Windows"),
    (r"Mac OS X|Macintosh", "macOS"),
    (r"CrOS", "ChromeOS"),
    (r"Linux", "Linux"),
)


def describe_user_agent(user_agent: str | None) -> str:
    """Nhãn ngắn của thiết bị.

    Args:
        user_agent: Header User-Agent (có thể rỗng).

    Returns:
        Ví dụ "Chrome trên Windows", "Cốc Cốc trên Windows", "Safari trên iOS"; không nhận ra thì
        `UNKNOWN_DEVICE`.
    """
    if not user_agent:
        return UNKNOWN_DEVICE
    browser = next((name for pattern, name in BROWSERS if re.search(pattern, user_agent)), "")
    system = next((name for pattern, name in SYSTEMS if re.search(pattern, user_agent)), "")
    if browser and system:
        return f"{browser} trên {system}"
    return browser or system or UNKNOWN_DEVICE
