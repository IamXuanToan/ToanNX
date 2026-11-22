"""NotificationKickService: mốc "sớm nhất có việc" trong Redis + tin QStash."""

import time
from datetime import timedelta
from unittest.mock import MagicMock

from django.utils import timezone

from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.services.notification_kick_service import NEXT_DUE_KEY, NotificationKickService


def _service() -> tuple[NotificationKickService, MagicMock]:
    qstash = MagicMock()
    return NotificationKickService(qstash_client=qstash), qstash


def test_without_redis_always_has_work() -> None:
    service, _ = _service()
    assert service.has_due_work()


def test_kick_lowers_marker_and_publishes(fake_redis: FakeRedis) -> None:
    service, qstash = _service()
    service.kick(120)
    assert not service.has_due_work()  # mốc sau 120 giây
    service.kick()
    assert service.has_due_work()  # kick mới hạ mốc về hiện tại
    assert qstash.publish.call_count == 2
    assert qstash.publish.call_args.kwargs["delay_seconds"] == 0


def test_missing_marker_means_work(fake_redis: FakeRedis) -> None:
    service, _ = _service()
    assert service.has_due_work()


def test_remember_next_due_idle_and_concurrent_kick(fake_redis: FakeRedis) -> None:
    service, _ = _service()
    marker = service.read_marker()
    service.remember_next_due(None, marker)
    assert not service.has_due_work()  # hết việc: nghỉ tới lần kiểm lại

    marker = service.read_marker()
    service.kick()  # có thông báo mới trong lúc đang gửi
    service.remember_next_due(timezone.now() + timedelta(hours=1), marker)
    assert service.has_due_work()  # không ghi đè mốc vừa hạ


def test_remember_next_due_in_future(fake_redis: FakeRedis) -> None:
    service, _ = _service()
    service.remember_next_due(timezone.now() + timedelta(minutes=5), service.read_marker())
    assert float(fake_redis.data[NEXT_DUE_KEY]) > time.time() + 200
