"""Kiểm thử danh sách Nhắc việc: GET /api/v1/workspace/reminders."""

from datetime import date, timedelta
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/reminders"


class TestReminderListApi(BaseApiTestCase):
    """Kiểm thử lọc `due_from`/`due_to`/`is_completed`/`priority`, cô lập owner & 401/403."""

    def test_list_filters_and_isolation(self, user: Any, login: Any, client: Any) -> None:
        other = UserFactory()
        today = date(2026, 11, 26)
        Reminder.objects.create(
            owner=user, title="Việc hôm nay", due_date=today, priority=Reminder.Priority.HIGH
        )
        Reminder.objects.create(
            owner=user,
            title="Việc tuần sau",
            due_date=today + timedelta(days=7),
            priority=Reminder.Priority.LOW,
        )
        Reminder.objects.create(owner=other, title="Việc người khác", due_date=today)

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        items, pag = self.assert_paginated(
            login(user).get(
                URL,
                {
                    "due_from": "2026-11-25",
                    "due_to": "2026-11-27",
                    "priority": "HIGH,URGENT",
                    "page": 1,
                },
            )
        )
        assert pag["total"] == 1
        assert items[0]["title"] == "Việc hôm nay"
