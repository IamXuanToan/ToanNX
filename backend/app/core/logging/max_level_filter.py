"""Logging filter giới hạn mức log tối đa cho luồng stdout."""

import logging


class MaxLevelFilter(logging.Filter):
    """Chỉ giữ lại log có mức nhỏ hơn hoặc bằng `max_level` (mặc định `INFO`)."""

    def __init__(self, max_level: int = logging.INFO) -> None:
        """Khởi tạo ngưỡng mức log tối đa."""
        super().__init__()
        self.max_level = max_level

    def filter(self, record: logging.LogRecord) -> bool:
        """Trả True nếu bản ghi log nằm dưới hoặc bằng `max_level`."""
        return record.levelno <= self.max_level
