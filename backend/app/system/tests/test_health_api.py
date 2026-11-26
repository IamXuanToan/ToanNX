"""Kiểm thử endpoint health check (/api/v1/system/health & /health/ready): bảo đảm 0 SQL, 0 Redis."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis

pytestmark = pytest.mark.django_db
HEALTH_URL = "/api/v1/system/health"
READINESS_URL = "/api/v1/system/health/ready"


class TestHealthApi(BaseApiTestCase):
    """Đảm bảo health check công khai không đánh thức Neon PostgreSQL và không gọi Redis."""

    def test_health_uses_zero_sql_and_zero_redis(
        self, client: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        with django_assert_num_queries(0):
            res = client.get(HEALTH_URL)

        data = self.assert_success(res, 200)
        assert data["status"] == "ok"
        assert "debug" in data
        assert fake_redis.commands == 0
        assert fake_redis.data == {}

    def test_readiness_verifies_database_connection(self, client: Any) -> None:
        res = client.get(READINESS_URL)
        data = self.assert_success(res, 200)
        assert data == {"status": "ready"}
