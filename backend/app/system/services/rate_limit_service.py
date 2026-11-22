"""Rate limit cửa sổ cố định: đếm bằng Redis (Upstash) khi có, dự phòng PostgreSQL.

Vercel Functions không giữ bộ nhớ giữa các invocation nên không dùng limiter in-memory. Có Redis thì lượt
khách công khai không ghi Neon (không đánh thức DB, xem `docs/architecture/infrastructure.md` §3.2); Redis
trống hoặc lỗi thì đếm bằng bucket PostgreSQL như trước. Hai nơi cùng cửa sổ, cùng giới hạn, cùng lỗi.
"""

import hashlib
import math
from datetime import datetime, timedelta

from django.conf import settings
from django.utils import timezone

from app.core.cache.cache_service import CacheService
from app.core.exceptions.rate_limit_error import RateLimitError
from app.system.repositories.rate_limit_bucket_repository import (
    RateLimitBucketRepository,
)


class RateLimitService:
    """Ghi nhận và chặn khi vượt giới hạn."""

    def __init__(
        self, repository: RateLimitBucketRepository | None = None, cache_service: CacheService | None = None
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository bộ đếm (dự phòng khi không có Redis).
            cache_service: Redis.
        """
        self.repository = repository or RateLimitBucketRepository()
        self.cache_service = cache_service or CacheService()

    def hit(self, key: str, limit: int, window_seconds: int) -> None:
        """Ghi nhận một lần gọi; chặn khi vượt giới hạn.

        Args:
            key: Khóa (ví dụ `login:email:ip`), sẽ được băm trước khi lưu.
            limit: Số lần tối đa trong cửa sổ.
            window_seconds: Độ dài cửa sổ.

        Raises:
            RateLimitError: Vượt giới hạn.
        """
        if not settings.RATE_LIMIT_ENABLED:
            return
        now = timezone.now()
        start = self._window_start(now, window_seconds)
        expires = start + timedelta(seconds=window_seconds)
        key_hash = self._hash(key)
        count = self.cache_service.incr_window(self._cache_key(key_hash, start), window_seconds)
        if count is None:
            count = self.repository.increment(key_hash, start, expires)
        if count > limit:
            raise RateLimitError(retry_after=max(1, math.ceil((expires - now).total_seconds())))

    def purge_expired(self, now: datetime) -> int:
        """Xóa bucket rate limit đã hết cửa sổ.

        Args:
            now: Mốc hiện tại.

        Returns:
            Số bucket đã xóa.
        """
        return self.repository.delete_expired(now)

    def reset(self, key: str, window_seconds: int) -> None:
        """Xóa bộ đếm cửa sổ hiện tại (ví dụ sau khi đăng nhập thành công).

        Args:
            key: Khóa.
            window_seconds: Độ dài cửa sổ.
        """
        key_hash = self._hash(key)
        start = self._window_start(timezone.now(), window_seconds)
        if self.cache_service.enabled:
            self.cache_service.delete(self._cache_key(key_hash, start))
        # Luôn xóa cả bucket DB: lượt trước có thể đã đếm ở dự phòng khi Redis lỗi.
        self.repository.delete_window(key_hash, start)

    @staticmethod
    def _cache_key(key_hash: str, window_start: datetime) -> str:
        """Khóa Redis của một cửa sổ."""
        return f"rate_limit:{key_hash}:{int(window_start.timestamp())}"

    @staticmethod
    def _hash(key: str) -> str:
        """Băm khóa để không lưu email/IP thô."""
        return hashlib.sha256(key.encode()).hexdigest()

    @staticmethod
    def _window_start(now: datetime, window_seconds: int) -> datetime:
        """Đầu cửa sổ cố định chứa `now`."""
        epoch = math.floor(now.timestamp() / window_seconds) * window_seconds
        return datetime.fromtimestamp(epoch, tz=now.tzinfo)
