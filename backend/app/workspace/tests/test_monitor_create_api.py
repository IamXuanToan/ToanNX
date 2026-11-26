"""Kiểm thử tạo Mục tiêu Uptime: POST /api/v1/workspace/monitor-targets."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.exceptions.validation_error import ValidationError
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.permissions.monitor_target_permission import MonitorTargetPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/monitor-targets"


class TestMonitorCreateApi(BaseApiTestCase):
    """Kiểm thử chống SSRF (`WORKSPACE_MONITOR_URL_UNSAFE`), `timeout <= 5s`, `interval >= 15p`."""

    def test_create_ssrf_and_limits(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.post(URL, {}, format="json"))
        self.assert_forbidden(login(user).post(URL, {}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CREATE)
        api = login(user)

        # Từ chối IP nội bộ / SSRF khi tạo monitor.
        with patch(
            "app.workspace.services.monitor_target_service.validate_url_safety",
            side_effect=ValidationError(details={"url": ["Địa chỉ đích không được phép truy cập."]}),
        ):
            unsafe = api.post(URL, {"name": "Local", "url": "http://127.0.0.1:8000/secret"}, format="json")
            self.assert_error(unsafe, 400, "WORKSPACE_MONITOR_URL_UNSAFE")

        # Vượt timeout 5s hoặc dưới 15 phút → 400 VALIDATION_ERROR
        self.assert_error(
            api.post(
                URL,
                {"name": "Slow", "url": "https://example.com", "timeout_seconds": 6},
                format="json",
            ),
            400,
            "VALIDATION_ERROR",
        )
        self.assert_error(
            api.post(
                URL,
                {"name": "Fast", "url": "https://example.com", "check_interval_minutes": 5},
                format="json",
            ),
            400,
            "VALIDATION_ERROR",
        )

        with patch(
            "app.workspace.services.monitor_target_service.validate_url_safety",
            side_effect=lambda u: u,
        ):
            res = api.post(
                URL,
                {
                    "name": "Blog",
                    "url": "https://example.com",
                    "method": "HEAD",
                    "timeout_seconds": 3,
                    "check_interval_minutes": 15,
                },
                format="json",
            )
            data = self.assert_success(res, 201)
            assert data["timeout_seconds"] == 3
            assert data["check_interval_minutes"] == 15
