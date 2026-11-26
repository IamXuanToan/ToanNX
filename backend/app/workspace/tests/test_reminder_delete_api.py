"""Kiểm thử xóa mềm Nhắc việc: DELETE /api/v1/workspace/reminders/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db


class TestReminderDeleteApi(BaseApiTestCase):
    """Kiểm thử DELETE nhắc việc."""

    def test_delete_success(self, user: Any, login: Any) -> None:
        rem = Reminder.objects.create(owner=user, title="Del", due_date=date(2026, 12, 1))
        grant(user, P.DELETE)
        assert login(user).delete(f"/api/v1/workspace/reminders/{rem.pk}").status_code == 204
