"""Kiểm thử xóa Sự cố Uptime: DELETE /api/v1/workspace/monitor-incidents/{id}."""

from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_incident_permission import MonitorIncidentPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorIncidentDeleteApi(BaseApiTestCase):
    """Kiểm thử xóa mềm sự cố."""

    def test_delete_success(self, user: Any, login: Any) -> None:
        target = MonitorTarget.objects.create(owner=user, name="Site", url="https://example.com")
        inc = MonitorIncident.objects.create(owner=user, target=target, started_at=timezone.now())
        grant(user, P.DELETE)
        assert login(user).delete(f"/api/v1/workspace/monitor-incidents/{inc.pk}").status_code == 204
