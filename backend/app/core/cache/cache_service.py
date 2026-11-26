"""Cache dùng chung trên Redis (Upstash) — chỉ để tăng tốc, không bao giờ là nguồn dữ liệu gốc.

- `REDIS_URL` trống (local, pytest) → `enabled` False, mọi lệnh đọc trả về như cache miss.
- Redis lỗi hoặc hết hạn mức lệnh → ghi log cảnh báo, tạm ngắt `OUTAGE_SECONDS` giây (không chờ timeout ở
  từng request), nơi gọi tự dùng dự phòng (PostgreSQL). Không bao giờ ném lỗi ra nơi gọi.
- Khóa không có tiền tố tên dự án (`<module>:<resource>:...`), luôn có TTL. Giá trị lưu dạng JSON.
- Ngân sách lệnh: xem `docs/architecture/infrastructure.md` §3.3 (gói free 500.000 lệnh/tháng).
"""

import json
import logging
import threading
import time
from typing import Any, ClassVar

from django.conf import settings

logger = logging.getLogger(__name__)

# Timeout kết nối và mỗi lệnh (giây): Redis chậm thì coi như không có, không làm chậm request.
SOCKET_TIMEOUT_SECONDS = 1.0
# Sau một lần lỗi, bỏ qua Redis trong khoảng này.
OUTAGE_SECONDS = 30.0
VERSION_SUFFIX = ":ver"
# Upstash chỉ nhận kết nối TLS: URL `redis://...upstash.io` bị server đóng ngay, nên tự nâng lên `rediss://`.
TLS_ONLY_HOST_SUFFIX = ".upstash.io"
# Khóa version của namespace sống lâu hơn mọi dữ liệu dùng nó.
VERSION_TTL_SECONDS = 30 * 24 * 3600


class CacheService:
    """Bọc client Redis dùng chung cho cả process (kết nối tạo lười, dùng lại giữa các request)."""

    _lock: ClassVar[threading.Lock] = threading.Lock()
    _client: ClassVar[Any | None] = None
    _client_url: ClassVar[str] = ""
    _down_until: ClassVar[float] = 0.0

    @property
    def enabled(self) -> bool:
        """Đã cấu hình Redis (dữ liệu cache dùng chung giữa các instance)."""
        return bool(settings.REDIS_URL)

    # ------------------------------------------------------------------ giá trị
    def get_json(self, key: str) -> Any | None:
        """Đọc giá trị JSON; không có, Redis tắt hoặc lỗi → None."""
        raw = self._run("get", lambda client: client.get(key))
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (TypeError, ValueError):
            return None

    def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Ghi giá trị JSON có TTL (lỗi thì bỏ qua)."""
        payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str)
        self._run("set", lambda client: client.set(key, payload, ex=max(1, int(ttl_seconds))))

    def set_if_absent(self, key: str, value: Any, ttl_seconds: int) -> bool:
        """Đặt khóa nguyên tử (`SET ... NX EX`); trả False nếu khóa đã có, True nếu ghi mới/lỗi."""
        if not self._available():
            return True
        payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str)
        sentinel = object()
        acquired: list[bool] = []

        def run(client: Any) -> object:
            result = client.set(key, payload, nx=True, ex=max(1, int(ttl_seconds)))
            acquired.append(bool(result))
            return result if result is not None else sentinel

        outcome = self._run("set_if_absent", run)
        if outcome is None:
            return True
        return bool(acquired[0]) if acquired else False

    def delete(self, *keys: str) -> None:
        """Xóa khóa (lỗi thì bỏ qua)."""
        if keys:
            self._run("delete", lambda client: client.delete(*keys))

    # ------------------------------------------------------------------ bộ đếm
    def incr_window(self, key: str, ttl_seconds: int) -> int | None:
        """Tăng bộ đếm của một cửa sổ; TTL chỉ đặt ở lần đầu (trung bình ~1 lệnh mỗi lần gọi).

        Returns:
            Giá trị sau khi tăng; None khi Redis tắt/lỗi (nơi gọi dùng dự phòng).
        """

        def run(client: Any) -> int:
            count = int(client.incr(key))
            if count == 1:
                client.expire(key, max(1, int(ttl_seconds)))
            return count

        result = self._run("incr", run)
        return None if result is None else int(result)

    # ------------------------------------------------------------------ version theo namespace
    def namespace_version(self, namespace: str) -> int | None:
        """Version hiện tại của namespace (0 khi chưa có); None khi Redis tắt/lỗi."""
        if not self._available():
            return None
        raw = self._run("get", lambda client: client.get(f"{namespace}{VERSION_SUFFIX}"))
        if raw is None:
            return None if not self._available() else 0
        try:
            return int(raw)
        except (TypeError, ValueError):
            return 0

    def bump_namespace(self, namespace: str) -> None:
        """Tăng version để mọi khóa cũ của namespace hết hiệu lực (khóa cũ tự hết theo TTL)."""
        key = f"{namespace}{VERSION_SUFFIX}"

        def run(client: Any) -> None:
            client.incr(key)
            client.expire(key, VERSION_TTL_SECONDS)

        self._run("bump", run)

    # ------------------------------------------------------------------ nội bộ
    def _available(self) -> bool:
        return self.enabled and time.monotonic() >= CacheService._down_until

    def _run(self, operation: str, command: Any) -> Any:
        """Chạy một lệnh; lỗi → log, tạm ngắt Redis, trả None."""
        if not self._available():
            return None
        try:
            return command(self._get_client())
        except Exception as exc:  # noqa: BLE001 - Redis chỉ để tăng tốc, lỗi không được làm hỏng request
            CacheService._down_until = time.monotonic() + OUTAGE_SECONDS
            logger.warning("cache.unavailable op=%s error=%s", operation, type(exc).__name__)
            return None

    @staticmethod
    def normalize_url(url: str) -> str:
        """Dùng TLS cho host Upstash dù URL ghi `redis://` (Upstash từ chối kết nối không mã hóa).

        Args:
            url: `REDIS_URL` như cấu hình.

        Returns:
            URL dùng để kết nối.
        """
        scheme, _, rest = url.partition("://")
        host = rest.rsplit("@", 1)[-1].split(":", 1)[0].split("/", 1)[0]
        if scheme == "redis" and host.endswith(TLS_ONLY_HOST_SUFFIX):
            return f"rediss://{rest}"
        return url

    @classmethod
    def _get_client(cls) -> Any:
        url = cls.normalize_url(settings.REDIS_URL)
        with cls._lock:
            if cls._client is None or cls._client_url not in (url, settings.REDIS_URL):
                import redis  # noqa: PLC0415 - chỉ nạp khi thật sự dùng Redis

                cls._client = redis.Redis.from_url(
                    url,
                    socket_connect_timeout=SOCKET_TIMEOUT_SECONDS,
                    socket_timeout=SOCKET_TIMEOUT_SECONDS,
                    retry_on_timeout=False,
                    decode_responses=True,
                )
                cls._client_url = url
            return cls._client

    @classmethod
    def use_client(cls, client: Any | None, url: str = "") -> None:
        """Gắn client sẵn (test dùng Redis giả) hoặc bỏ client (None).

        Args:
            client: Client có `get/set/delete/incr/expire`.
            url: URL ứng với client (phải bằng `settings.REDIS_URL` để được dùng).
        """
        with cls._lock:
            cls._client = client
            cls._client_url = url if client is not None else ""
            cls._down_until = 0.0
