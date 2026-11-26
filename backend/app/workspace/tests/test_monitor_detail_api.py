"""Kiểm thử chi tiết Mục tiêu Uptime: GET /api/v1/workspace/monitor-targets/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorDetailApi(BaseApiTestCase):
    """Kiểm thử GET chi tiết monitor và owner isolation."""

    def test_detail_and_isolation(self, user: Any, login: Any) -> None:
        other = UserFactory()
        mine = MonitorTarget.objects.create(owner=user, name="Mine", url="https://example.com")
        theirs = MonitorTarget.objects.create(owner=other, name="Other", url="https://example.org")
        grant(user, P.READ)
        api = login(user)
        assert self.assert_success(api.get(f"/api/v1/workspace/monitor-targets/{mine.pk}"))["name"] == "Mine"
        self.assert_error(api.get(f"/api/v1/workspace/monitor-targets/{theirs.pk}"), 404, "NOT_FOUND")
