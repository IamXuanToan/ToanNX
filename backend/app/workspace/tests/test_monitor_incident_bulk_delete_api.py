"""Kiểm thử xóa hàng loạt Sự cố: POST /api/v1/workspace/monitor-incidents/bulk-delete."""

from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_incident_permission import MonitorIncidentPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorIncidentBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete sự cố."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        target = MonitorTarget.objects.create(owner=user, name="Site", url="https://example.com")
        inc = MonitorIncident.objects.create(owner=user, target=target, started_at=timezone.now())
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/monitor-incidents/bulk-delete",
                {"ids": [str(inc.pk)]},
                format="json",
            )
        )
        assert data["count"] == 1
