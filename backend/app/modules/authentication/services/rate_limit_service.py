"""Rate limit cửa sổ cố định lưu PostgreSQL.

Vercel Functions không giữ bộ nhớ giữa các invocation nên không dùng limiter
in-memory. Khi cần tải cao có thể thay repository bằng Redis, giữ nguyên service.
"""

import hashlib
import math
from datetime import datetime, timedelta

from django.conf import settings
from django.utils import timezone

from app.core.exceptions.rate_limit_error import RateLimitError
from app.modules.authentication.repositories.rate_limit_bucket_repository import (
    RateLimitBucketRepository,
)


class RateLimitService:
    """Ghi nhận và chặn khi vượt giới hạn."""

    def __init__(self, repository: RateLimitBucketRepository | None = None) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository bộ đếm.
        """
        self.repository = repository or RateLimitBucketRepository()

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
        if self.repository.increment(self._hash(key), start, expires) > limit:
            raise RateLimitError(retry_after=max(1, math.ceil((expires - now).total_seconds())))

    def reset(self, key: str, window_seconds: int) -> None:
        """Xóa bộ đếm cửa sổ hiện tại (ví dụ sau khi đăng nhập thành công).

        Args:
            key: Khóa.
            window_seconds: Độ dài cửa sổ.
        """
        self.repository.delete_window(self._hash(key), self._window_start(timezone.now(), window_seconds))

    @staticmethod
    def _hash(key: str) -> str:
        """Băm khóa để không lưu email/IP thô."""
        return hashlib.sha256(key.encode()).hexdigest()

    @staticmethod
    def _window_start(now: datetime, window_seconds: int) -> datetime:
        """Đầu cửa sổ cố định chứa `now`."""
        epoch = math.floor(now.timestamp() / window_seconds) * window_seconds
        return datetime.fromtimestamp(epoch, tz=now.tzinfo)
