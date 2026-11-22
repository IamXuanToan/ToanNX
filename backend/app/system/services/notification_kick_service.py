"""Đánh thức việc gửi thông báo mà không làm chậm request và không đánh thức Neon khi không có việc.

- `kick(delay)`: sau commit, hạ mốc "sớm nhất có việc" trong Redis và đăng một tin QStash gọi
  `POST /system/notifications/dispatch` (lượt function riêng, có thể hẹn trễ cho lần thử lại).
- `has_due_work()`: cron ngoài gọi dispatch định kỳ; mốc trong Redis chưa tới thì trả về ngay, **không query
  DB**. Không có Redis, khóa mất hoặc Redis lỗi → coi như có việc (an toàn hơn bỏ sót).
- `remember_next_due(...)`: sau mỗi lượt gửi, ghi mốc sớm nhất còn lại theo DB.
"""

import time
import uuid
from datetime import datetime
from typing import Any

from app.core.cache.cache_service import CacheService
from app.core.context.user_context import get_request_id
from app.core.utils.url import build_backend_url
from app.system.services.qstash_client import QstashClient

DISPATCH_PATH = "/api/v1/system/notifications/dispatch"
NEXT_DUE_KEY = "notification:next_due"
# Không còn việc thì vẫn kiểm DB một lần mỗi khoảng này (lưới an toàn khi mốc bị ghi đè sai).
IDLE_RECHECK_SECONDS = 6 * 3600


class NotificationKickService:
    """Chỉ đọc/ghi Redis và QStash; không chạm DB."""

    def __init__(
        self, cache_service: CacheService | None = None, qstash_client: QstashClient | None = None
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.cache_service = cache_service or CacheService()
        self.qstash_client = qstash_client or QstashClient()

    def kick(self, delay_seconds: int = 0) -> None:
        """Báo có việc gửi sau `delay_seconds` giây (lỗi Redis/QStash không ném ra).

        Args:
            delay_seconds: Hẹn trễ (lần thử lại theo lùi dần).
        """
        delay = max(0, int(delay_seconds))
        self._lower_next_due(time.time() + delay)
        request_key = get_request_id() or uuid.uuid4().hex
        self.qstash_client.publish(
            build_backend_url(DISPATCH_PATH),
            delay_seconds=delay,
            deduplication_id=f"notification-{request_key}-{delay}",
        )

    def read_marker(self) -> Any | None:
        """Giá trị mốc hiện tại (để so trước khi ghi đè ở `remember_next_due`)."""
        return self.cache_service.get_json(NEXT_DUE_KEY) if self.cache_service.enabled else None

    def has_due_work(self) -> bool:
        """Có thể có bản cần gửi ngay không."""
        if not self.cache_service.enabled:
            return True
        marker = self.cache_service.get_json(NEXT_DUE_KEY)
        if marker is None:
            return True
        try:
            return float(marker) <= time.time()
        except (TypeError, ValueError):
            return True

    def remember_next_due(self, next_due: datetime | None, marker_before: Any | None) -> None:
        """Ghi mốc sớm nhất còn lại; bỏ qua nếu trong lúc gửi đã có thông báo mới hạ mốc.

        Args:
            next_due: Mốc sớm nhất theo DB (None = hết việc).
            marker_before: Giá trị mốc đọc được trước lượt gửi.
        """
        if not self.cache_service.enabled:
            return
        if self.cache_service.get_json(NEXT_DUE_KEY) != marker_before:
            return
        now = time.time()
        value = now + IDLE_RECHECK_SECONDS if next_due is None else max(now, next_due.timestamp())
        self.cache_service.set_json(NEXT_DUE_KEY, value, IDLE_RECHECK_SECONDS)

    def _lower_next_due(self, due: float) -> None:
        if not self.cache_service.enabled:
            return
        current = self.cache_service.get_json(NEXT_DUE_KEY)
        try:
            if current is not None and float(current) <= due:
                return
        except (TypeError, ValueError):
            pass
        self.cache_service.set_json(NEXT_DUE_KEY, due, IDLE_RECHECK_SECONDS)
