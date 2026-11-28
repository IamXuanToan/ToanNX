"""Kiểm thử tạo Nhắc việc: POST /api/v1/workspace/reminders."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder_topic import ReminderTopic
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

        work_topic = ReminderTopic.objects.filter(code="work", is_system=True).first()
        assert work_topic is not None

        res = api.post(
            URL,
            {
                "title": "Gia hạn chứng chỉ",
                "due_date": "2026-01-31",
                "due_time": "09:30",
                "notify_minutes_before": 15,
                "reminder_days_before": [3, 8, 6, 3],
                "priority": "URGENT",
                "recurrence": "MONTHLY",
                "topic_id": str(work_topic.pk),
            },
            format="json",
        )
        data = self.assert_success(res, 201)
        assert data["topic"]["id"] == str(work_topic.pk)
        assert data["topic"]["name"] == "Công việc"
        assert data["due_time"] == "09:30:00"
        assert data["reminder_days_before"] == [8, 6, 3]
        assert data["is_completed"] is False
        assert "notification_channels" not in data

        min_res = api.post(
            URL,
            {
                "title": "Đặt vé tàu",
                "due_date": "2026-12-01",
            },
            format="json",
        )
        min_data = self.assert_success(min_res, 201)
        assert min_data["priority"] == "MEDIUM"

        bad_ch = api.post(
            URL,
            {"title": "Bad channel", "due_date": "2026-12-02", "notification_channels": ["WEBSITE"]},
            format="json",
        )
        self.assert_error(bad_ch, 400, "VALIDATION_ERROR")
