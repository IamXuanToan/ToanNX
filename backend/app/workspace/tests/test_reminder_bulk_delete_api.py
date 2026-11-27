"""Kiểm thử xóa hàng loạt Nhắc việc: POST /api/v1/workspace/reminders/bulk-delete."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db


class TestReminderBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete nhắc việc."""

    def test_bulk_delete(self, user: Any, login: Any) -> None:
        r1 = Reminder.objects.create(owner=user, title="R1", due_date=date(2026, 12, 1))
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post("/api/v1/workspace/reminders/bulk-delete", {"ids": [str(r1.pk)]}, format="json")
        )
        assert data["count"] == 1
