"""Kiểm thử xóa mềm Mục tiêu Uptime: DELETE /api/v1/workspace/monitor-targets/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorDeleteApi(BaseApiTestCase):
    """Kiểm thử DELETE monitor target."""

    def test_delete_success(self, user: Any, login: Any) -> None:
        target = MonitorTarget.objects.create(owner=user, name="Del", url="https://example.com")
        grant(user, P.DELETE)
        assert login(user).delete(f"/api/v1/workspace/monitor-targets/{target.pk}").status_code == 204
