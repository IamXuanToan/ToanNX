"""Kiểm thử xóa hàng loạt Monitor: POST /api/v1/workspace/monitor-targets/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete mục tiêu monitor."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        t1 = MonitorTarget.objects.create(owner=user, name="T1", url="https://example.com")
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/monitor-targets/bulk-delete",
                {"ids": [str(t1.pk)]},
                format="json",
            )
        )
        assert data["count"] == 1
