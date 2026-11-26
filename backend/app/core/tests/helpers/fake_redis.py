"""Redis giả trong bộ nhớ cho test (đủ các lệnh `CacheService` dùng), đếm số lệnh đã gọi."""

import time
from typing import Any


class FakeRedis:
    """Hỗ trợ get/set(ex)/delete/incr/expire; `fail=True` thì mọi lệnh ném lỗi như Redis sập."""

    def __init__(self, *, fail: bool = False) -> None:
        """Khởi tạo kho rỗng.

        Args:
            fail: Mọi lệnh ném `ConnectionError`.
        """
        self.data: dict[str, Any] = {}
        self.expires: dict[str, float] = {}
        self.commands = 0
        self.fail = fail

    def _tick(self) -> None:
        self.commands += 1
        if self.fail:
            raise ConnectionError("redis down")

    def _alive(self, key: str) -> bool:
        expires = self.expires.get(key)
        if expires is not None and expires <= time.monotonic():
            self.data.pop(key, None)
            self.expires.pop(key, None)
        return key in self.data

    def get(self, key: str) -> Any | None:
        """GET."""
        self._tick()
        return self.data[key] if self._alive(key) else None

    def set(self, key: str, value: Any, ex: int | None = None, nx: bool = False) -> bool | None:
        """SET (EX, NX)."""
        self._tick()
        if nx and self._alive(key):
            return None
        self.data[key] = str(value)
        if ex is not None:
            self.expires[key] = time.monotonic() + ex
        else:
            self.expires.pop(key, None)
        return True

    def delete(self, *keys: str) -> int:
        """DEL."""
        self._tick()
        removed = 0
        for key in keys:
            if self._alive(key):
                removed += 1
            self.data.pop(key, None)
            self.expires.pop(key, None)
        return removed

    def incr(self, key: str) -> int:
        """INCR."""
        self._tick()
        value = int(self.data[key]) + 1 if self._alive(key) else 1
        self.data[key] = str(value)
        return value

    def expire(self, key: str, seconds: int) -> bool:
        """EXPIRE."""
        self._tick()
        if not self._alive(key):
            return False
        self.expires[key] = time.monotonic() + seconds
        return True

    def ttl(self, key: str) -> int:
        """TTL còn lại (giây), -1 nếu không hết hạn, -2 nếu không có khóa (chỉ dùng trong test)."""
        if not self._alive(key):
            return -2
        expires = self.expires.get(key)
        return -1 if expires is None else int(expires - time.monotonic())
