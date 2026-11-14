"""Logging filter gắn request_id vào mọi log record."""

import logging

from app.core.context.user_context import get_request_id


class RequestContextFilter(logging.Filter):
    """Bổ sung `request_id` từ context vào log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Gắn request_id vào record.

        Args:
            record: Log record.

        Returns:
            Luôn True.
        """
        record.request_id = get_request_id() or "-"
        return True
