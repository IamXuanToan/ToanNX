"""Kiểm thử tạo Nhắc việc: POST /api/v1/workspace/reminders."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/reminders"


class TestReminderCreateApi(BaseApiTestCase):
    """Kiểm thử tạo đầy đủ, tối thiểu, validation & 401/403."""

    def test_create_full_and_min(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.post(URL, {}, format="json"))
        self.assert_forbidden(login(user).post(URL, {}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CREATE)
        api = login(user)
        self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")

        res = api.post(
            URL,
            {
                "title": "Gia hạn chứng chỉ",
                "due_date": "2026-01-31",
                "due_time": "09:30",
                "notify_minutes_before": 15,
                "priority": "URGENT",
                "recurrence": "MONTHLY",
                "tags": ["ssl", "ops"],
            },
            format="json",
        )
        data = self.assert_success(res, 201)
        assert data["anchor_day"] == 31
        assert data["due_time"] == "09:30:00"
        assert data["is_completed"] is False

        min_res = api.post(URL, {"title": "Min task", "due_date": "2026-12-01"}, format="json")
        assert self.assert_success(min_res, 201)["priority"] == "MEDIUM"
