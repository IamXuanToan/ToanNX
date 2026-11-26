"""Kiểm thử ping thủ công Monitor: POST /api/v1/workspace/monitor-targets/{id}/ping."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.notification import Notification
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorPingApi(BaseApiTestCase):
    """Ping DOWN → mở MonitorIncident + notify; ping HEALTHY lại → đóng Incident + notify recovered."""

    def test_ping_down_then_recovered_creates_and_closes_incident(self, user: Any, login: Any) -> None:
        target = MonitorTarget.objects.create(
            owner=user,
            name="Checkout API",
            url="https://api.example.com/checkout",
            last_status=MonitorTarget.Status.HEALTHY,
        )
        grant(user, P.READ, P.UPDATE)
        api = login(user)

        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.probe",
            return_value={
                "ok": True,
                "status_code": 502,
                "latency_ms": 120,
                "final_url": target.url,
                "error_message": "",
            },
        ):
            down = self.assert_success(api.post(f"/api/v1/workspace/monitor-targets/{target.pk}/ping"))
        assert down["status"] == "DOWN"
        assert down["incident_id"] is not None
        assert Notification.objects.filter(recipient=user, event_code="workspace.monitor.down").count() == 1

        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.probe",
            return_value={
                "ok": True,
                "status_code": 200,
                "latency_ms": 55,
                "final_url": target.url,
                "error_message": "",
            },
        ):
            up = self.assert_success(api.post(f"/api/v1/workspace/monitor-targets/{target.pk}/ping"))
        assert up["status"] == "HEALTHY"
        inc = MonitorIncident.objects.get(pk=down["incident_id"])
        assert inc.resolved_at is not None
        assert (
            Notification.objects.filter(recipient=user, event_code="workspace.monitor.recovered").count() == 1
        )
