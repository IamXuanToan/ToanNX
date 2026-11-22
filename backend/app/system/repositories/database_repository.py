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

    def size_bytes(self) -> int:
        """Dung lượng database hiện tại (byte), tính như Neon tính hạn mức lưu trữ của project."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_database_size(current_database())")
            row = cursor.fetchone()
        return int(row[0]) if row else 0
