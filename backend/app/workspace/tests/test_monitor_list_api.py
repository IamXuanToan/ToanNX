"""Kiểm thử danh sách Mục tiêu Uptime: GET /api/v1/workspace/monitor-targets."""

from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.cache.cache_service import CacheService
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.constants.workspace_defaults import REDIS_MONITOR_STATE_KEY
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/monitor-targets"


class TestMonitorListApi(BaseApiTestCase):
    """Kiểm thử trộn trạng thái mới hơn từ Redis `monitor_state` lên kết quả list."""

    def test_list_overlays_fresher_redis_state(self, user: Any, login: Any, fake_redis: Any) -> None:
        target = MonitorTarget.objects.create(
            owner=user,
            name="API Health",
            url="https://api.example.com/health",
            last_status=MonitorTarget.Status.UNKNOWN,
            last_checked_at=timezone.now() - timedelta(hours=2),
        )
        fresher_dt = timezone.now().isoformat()
        CacheService().set_json(
            REDIS_MONITOR_STATE_KEY.format(target_id=target.pk),
            {
                "last_status": "HEALTHY",
                "last_status_code": 200,
                "last_latency_ms": 42,
                "last_checked_at": fresher_dt,
                "consecutive_failures": 0,
            },
            3600,
        )
        grant(user, P.READ)
        items, pag = self.assert_paginated(login(user).get(URL, {"page": 1}))
        assert pag["total"] == 1
        assert items[0]["last_status"] == "HEALTHY"
        assert items[0]["last_latency_ms"] == 42
