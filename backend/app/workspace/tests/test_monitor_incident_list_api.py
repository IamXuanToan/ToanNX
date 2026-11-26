"""Kiểm thử danh sách Sự cố Uptime: GET /api/v1/workspace/monitor-incidents."""

from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_incident_permission import MonitorIncidentPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/monitor-incidents"


class TestMonitorIncidentListApi(BaseApiTestCase):
    """Kiểm thử lọc `?resolved=true/false` và chặn tạo trực tiếp (DENY 403)."""

    def test_list_filter_resolved_and_deny_create(self, user: Any, login: Any) -> None:
        target = MonitorTarget.objects.create(owner=user, name="Site", url="https://example.com")
        MonitorIncident.objects.create(owner=user, target=target, started_at=timezone.now())
        MonitorIncident.objects.create(
            owner=user,
            target=target,
            started_at=timezone.now(),
            resolved_at=timezone.now(),
            duration_seconds=10,
        )
        grant(user, P.READ)
        api = login(user)

        unresolved, pag = self.assert_paginated(api.get(URL, {"resolved": "false", "page": 1}))
        assert pag["total"] == 1
        assert unresolved[0]["resolved_at"] is None
        self.assert_forbidden(api.post(URL, {}, format="json"), "PERMISSION_DENIED")
