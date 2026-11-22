"""CacheService: Redis chỉ để tăng tốc — tắt hoặc lỗi thì như cache miss, không ném lỗi."""

from typing import Any

from app.core.cache.cache_service import CacheService
from app.core.tests.helpers.fake_redis import FakeRedis


def test_disabled_without_redis_url() -> None:
    service = CacheService()
    assert not service.enabled
    service.set_json("k", {"a": 1}, 60)
    assert service.get_json("k") is None
    assert service.incr_window("k", 60) is None
    assert service.namespace_version("ns") is None


def test_json_roundtrip_and_delete(fake_redis: FakeRedis) -> None:
    service = CacheService()
    service.set_json("k", {"a": 1, "b": "Tiếng Việt"}, 60)
    assert service.get_json("k") == {"a": 1, "b": "Tiếng Việt"}
    service.delete("k")
    assert service.get_json("k") is None


def test_incr_window_sets_ttl_only_on_first_hit(fake_redis: FakeRedis) -> None:
    service = CacheService()
    assert service.incr_window("rate", 30) == 1
    first = fake_redis.commands
    assert service.incr_window("rate", 30) == 2
    assert fake_redis.commands - first == 1  # lần sau chỉ INCR, không EXPIRE
    assert 0 < fake_redis.ttl("rate") <= 30


def test_namespace_version_bump(fake_redis: FakeRedis) -> None:
    service = CacheService()
    assert service.namespace_version("ns") == 0
    service.bump_namespace("ns")
    service.bump_namespace("ns")
    assert service.namespace_version("ns") == 2


def test_failure_returns_miss_and_pauses_redis(settings: Any) -> None:
    broken = FakeRedis(fail=True)
    settings.REDIS_URL = "redis://fake"
    CacheService.use_client(broken, "redis://fake")
    service = CacheService()
    assert service.get_json("k") is None
    assert service.incr_window("k", 60) is None
    # Sau lần lỗi đầu, Redis bị tạm ngắt: không gọi thêm lệnh nào (không chờ timeout ở từng request).
    assert broken.commands == 1
    assert service.namespace_version("ns") is None
