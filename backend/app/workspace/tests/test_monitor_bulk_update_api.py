"""Kiểm thử bật/tắt hàng loạt Monitor: POST /api/v1/workspace/monitor-targets/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử bulk-update cờ `is_active`."""

    def test_bulk_update_is_active(self, user: Any, login: Any) -> None:
        t1 = MonitorTarget.objects.create(owner=user, name="T1", url="https://example.com")
        grant(user, P.UPDATE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/monitor-targets/bulk-update",
                {"ids": [str(t1.pk)], "is_active": False},
                format="json",
            )
        )
        assert data["count"] == 1
        t1.refresh_from_db()
        assert t1.is_active is False
