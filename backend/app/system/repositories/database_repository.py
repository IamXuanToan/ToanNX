"""Repository kiểm tra kết nối database (không gắn với model nào)."""

from django.db import connection


class DatabaseRepository:
    """Truy vấn tối thiểu để xác nhận database phản hồi."""

    def ping(self) -> None:
        """Chạy `SELECT 1`.

        Raises:
            django.db.DatabaseError: Database không phản hồi.
        """
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
