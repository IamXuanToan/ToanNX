"""Kiểm thử cập nhật Nhắc việc: PATCH /api/v1/workspace/reminders/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db


class TestReminderUpdateApi(BaseApiTestCase):
    """Hoàn thành nhắc việc lặp `MONTHLY` (anchor_day=31) tự sinh kỳ kế tiếp kẹp 28/02."""

    def test_complete_recurring_reminder_spawns_clamped_next_occurrence(self, user: Any, login: Any) -> None:
        rem = Reminder.objects.create(
            owner=user,
            title="Đóng tiền server",
            due_date=date(2026, 1, 31),
            recurrence=Reminder.Recurrence.MONTHLY,
            anchor_day=31,
            priority=Reminder.Priority.HIGH,
        )
        grant(user, P.UPDATE)
        res = login(user).patch(
            f"/api/v1/workspace/reminders/{rem.pk}", {"is_completed": True}, format="json"
        )
        data = self.assert_success(res)
        assert data["is_completed"] is True
        assert data["completed_at"] is not None

        next_rem = Reminder.objects.filter(owner=user, is_completed=False).first()
        assert next_rem is not None
        assert next_rem.due_date == date(2026, 2, 28)
        assert next_rem.anchor_day == 31
