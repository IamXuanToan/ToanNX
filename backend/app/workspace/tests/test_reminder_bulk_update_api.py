"""Kiểm thử đổi trạng thái hoàn thành hàng loạt: POST /api/v1/workspace/reminders/bulk-update."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P

pytestmark = pytest.mark.django_db


class TestReminderBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử bulk update `is_completed`."""

    def test_bulk_complete(self, user: Any, login: Any) -> None:
        r1 = Reminder.objects.create(owner=user, title="R1", due_date=date(2026, 12, 1))
        r2 = Reminder.objects.create(owner=user, title="R2", due_date=date(2026, 12, 2))
        grant(user, P.UPDATE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/reminders/bulk-update",
                {"ids": [str(r1.pk), str(r2.pk)], "is_completed": True},
                format="json",
            )
        )
        assert data["count"] == 2
        assert Reminder.objects.filter(pk__in=[r1.pk, r2.pk], is_completed=True).count() == 2
