"""Repository bộ đếm rate limit (upsert nguyên tử trên PostgreSQL)."""

from datetime import datetime

from django.db import connection

from app.core.repositories.core_repository import CoreRepository
from app.system.models.rate_limit_bucket import RateLimitBucket


class RateLimitBucketRepository(CoreRepository[RateLimitBucket]):
    """Truy cập dữ liệu RateLimitBucket."""

    model = RateLimitBucket

    def increment(self, key_hash: str, window_start: datetime, expires_at: datetime) -> int:
        """Tăng bộ đếm của cửa sổ và trả về giá trị mới.

        `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` nên nguyên tử khi nhiều instance chạy song song.

        Args:
            key_hash: Khóa đã băm.
            window_start: Đầu cửa sổ.
            expires_at: Hết hạn bản ghi.

        Returns:
            Số lần trong cửa sổ sau khi tăng.
        """
        table = RateLimitBucket._meta.db_table
        with connection.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO {table} (key_hash, window_start, count, expires_at) "  # noqa: S608 - tên bảng từ model
                "VALUES (%s, %s, 1, %s) "
                "ON CONFLICT (key_hash, window_start) "
                f"DO UPDATE SET count = {table}.count + 1 RETURNING count",
                [key_hash, window_start, expires_at],
            )
            row = cursor.fetchone()
        return int(row[0]) if row else 1

    def delete_window(self, key_hash: str, window_start: datetime) -> None:
        """Xóa bộ đếm của một cửa sổ.

        Args:
            key_hash: Khóa đã băm.
            window_start: Đầu cửa sổ.
        """
        self.hard_delete_where(key_hash=key_hash, window_start=window_start)

    def delete_expired(self, moment: datetime) -> int:
        """Xóa bucket đã hết hạn.

        Args:
            moment: Mốc thời gian (thường là bây giờ).

        Returns:
            Số bucket đã xóa.
        """
        return self.hard_delete_where(expires_at__lt=moment)
