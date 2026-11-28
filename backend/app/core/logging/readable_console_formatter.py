"""Formatter log thống nhất, dễ phân biệt mức DEBUG/INFO/WARNING/ERROR ở terminal và cloud."""

import logging
import sys

_LEVEL_COLORS: dict[int, str] = {
    logging.DEBUG: "\033[36m",
    logging.INFO: "\033[32m",
    logging.WARNING: "\033[33m",
    logging.ERROR: "\033[31m",
    logging.CRITICAL: "\033[1;31m",
}
_RESET = "\033[0m"


class ReadableConsoleFormatter(logging.Formatter):
    """Định dạng `[LEVEL  ]` rõ ràng, chỉ bật màu ANSI khi xuất ra terminal TTY."""

    def __init__(
        self,
        fmt: str = "%(asctime)s [%(levelname)-7s] [%(request_id)s] %(name)s: %(message)s",
        datefmt: str = "%Y-%m-%d %H:%M:%S",
        *,
        use_color: bool | None = None,
    ) -> None:
        """Khởi tạo formatter với tùy chọn tự phát hiện TTY."""
        super().__init__(fmt=fmt, datefmt=datefmt)
        if use_color is None:
            self.use_color = bool(getattr(sys.stderr, "isatty", lambda: False)())
        else:
            self.use_color = use_color

    def format(self, record: logging.LogRecord) -> str:
        """Định dạng bản ghi log, giữ nguyên `record.levelname` gốc cho các handler khác."""
        rendered = super().format(record)
        if not self.use_color:
            return rendered
        color = _LEVEL_COLORS.get(record.levelno, "")
        if not color:
            return rendered
        tag = f"[{record.levelname:<7}]"
        return rendered.replace(tag, f"{color}{tag}{_RESET}", 1)
