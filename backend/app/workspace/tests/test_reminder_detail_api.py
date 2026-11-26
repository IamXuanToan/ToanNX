"""Kiểm thử chi tiết Nhắc việc: GET /api/v1/workspace/reminders/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db


class TestReminderDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết nhắc việc và cách ly owner."""

    def test_detail_and_isolation(self, user: Any, login: Any) -> None:
        other = UserFactory()
        mine = Reminder.objects.create(owner=user, title="Mine", due_date=date(2026, 12, 1))
        theirs = Reminder.objects.create(owner=other, title="Theirs", due_date=date(2026, 12, 1))
        grant(user, P.READ)
        api = login(user)
        assert self.assert_success(api.get(f"/api/v1/workspace/reminders/{mine.pk}"))["title"] == "Mine"
        self.assert_error(api.get(f"/api/v1/workspace/reminders/{theirs.pk}"), 404, "NOT_FOUND")
