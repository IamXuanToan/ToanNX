"""Kiểm thử cập nhật Mục tiêu Uptime: PATCH /api/v1/workspace/monitor-targets/{id}."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.exceptions.validation_error import ValidationError
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db


class TestMonitorUpdateApi(BaseApiTestCase):
    """Kiểm thử cập nhật và chặn URL SSRF khi PATCH."""

    def test_update_validates_url_safety(self, user: Any, login: Any) -> None:
        target = MonitorTarget.objects.create(owner=user, name="Mon", url="https://example.com")
        grant(user, P.UPDATE)
        api = login(user)
        with patch(
            "app.workspace.services.monitor_target_service.validate_url_safety",
            side_effect=ValidationError(details={"url": ["Blocked"]}),
        ):
            self.assert_error(
                api.patch(
                    f"/api/v1/workspace/monitor-targets/{target.pk}",
                    {"url": "http://169.254.169.254/latest"},
                    format="json",
                ),
                400,
                "WORKSPACE_MONITOR_URL_UNSAFE",
            )
        data = self.assert_success(
            api.patch(
                f"/api/v1/workspace/monitor-targets/{target.pk}",
                {"name": "Mon Renamed", "is_active": False},
                format="json",
            )
        )
        assert data["name"] == "Mon Renamed"
        assert data["is_active"] is False
