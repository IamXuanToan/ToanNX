"""DatabaseUsageService: cảnh báo khi database gần chạm hạn mức (Neon free 1 GB)."""

from typing import Any
from unittest.mock import MagicMock

import pytest

from app.system.models.notification import Notification
from app.system.repositories.database_repository import DatabaseRepository
from app.system.services.database_usage_service import DatabaseUsageService
from app.system.tasks.check_database_size import check_database_size

pytestmark = pytest.mark.django_db
MB = 1024 * 1024


def _service(used: int) -> DatabaseUsageService:
    repository = MagicMock(spec=DatabaseRepository)
    repository.size_bytes.return_value = used
    return DatabaseUsageService(database_repository=repository)


def test_real_size_is_measured() -> None:
    assert DatabaseRepository().size_bytes() > 0
    assert check_database_size() >= 0


def test_warns_once_per_day_from_80_percent(settings: Any, superuser: Any) -> None:
    settings.DATABASE_MAX_BYTES = 100 * MB
    assert _service(70 * MB).check_quota()["percent"] == 70
    assert not Notification.objects.filter(event_code="system.database.quota_warning").exists()
    _service(85 * MB).check_quota()
    _service(90 * MB).check_quota()
    warning = Notification.objects.get(event_code="system.database.quota_warning", recipient=superuser)
    assert warning.params == {"percent": 85, "megabytes": 85}


def test_disabled_limit(settings: Any) -> None:
    settings.DATABASE_MAX_BYTES = 0
    assert _service(10**12).check_quota()["percent"] == 0
