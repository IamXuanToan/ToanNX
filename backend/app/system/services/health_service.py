"""Kiểm tra tình trạng hệ thống."""

import logging

from django.db import DatabaseError

from app.system.repositories.database_repository import DatabaseRepository

logger = logging.getLogger("app.system")


class HealthService:
    """Liveness/readiness."""

    def __init__(self, database_repository: DatabaseRepository | None = None) -> None:
        """Khởi tạo service.

        Args:
            database_repository: Repository database.
        """
        self.database_repository = database_repository or DatabaseRepository()

    def is_database_ready(self) -> bool:
        """Database phản hồi.

        Returns:
            True nếu sẵn sàng.
        """
        try:
            self.database_repository.ping()
        except DatabaseError:
            logger.exception("Database không sẵn sàng")
            return False
        return True
