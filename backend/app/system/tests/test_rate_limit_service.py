"""RateLimitService: đếm bằng Redis khi có (không ghi bucket DB), lỗi Redis thì về PostgreSQL."""

from typing import Any

import pytest

from app.core.cache.cache_service import CacheService
from app.core.exceptions.rate_limit_error import RateLimitError
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.models.rate_limit_bucket import RateLimitBucket
from app.system.services.rate_limit_service import RateLimitService

pytestmark = pytest.mark.django_db


def test_redis_counts_without_touching_db(fake_redis: FakeRedis, django_assert_num_queries: Any) -> None:
    service = RateLimitService()
    with django_assert_num_queries(0):
        service.hit("public:ip", 2, 60)
        service.hit("public:ip", 2, 60)
    with pytest.raises(RateLimitError):
        service.hit("public:ip", 2, 60)
    assert not RateLimitBucket.objects.exists()


def test_reset_clears_redis_window(fake_redis: FakeRedis) -> None:
    service = RateLimitService()
    service.hit("login:x", 1, 60)
    service.reset("login:x", 60)
    service.hit("login:x", 1, 60)  # không bị chặn sau reset


def test_falls_back_to_db_when_redis_fails(settings: Any) -> None:
    settings.REDIS_URL = "redis://fake"
    CacheService.use_client(FakeRedis(fail=True), "redis://fake")
    service = RateLimitService()
    service.hit("public:ip", 1, 60)
    assert RateLimitBucket.objects.get().count == 1
    with pytest.raises(RateLimitError):
        service.hit("public:ip", 1, 60)


def test_db_only_without_redis() -> None:
    RateLimitService().hit("public:ip", 5, 60)
    assert RateLimitBucket.objects.count() == 1
