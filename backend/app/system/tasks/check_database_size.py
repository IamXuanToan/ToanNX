"""Task kiểm dung lượng database so với hạn mức (chạy bởi cron dọn dẹp hằng ngày)."""

from app.system.services.database_usage_service import DatabaseUsageService


def check_database_size() -> int:
    """Đo dung lượng database, cảnh báo khi gần đầy.

    Returns:
        Phần trăm đã dùng.
    """
    return int(DatabaseUsageService().check_quota()["percent"])
