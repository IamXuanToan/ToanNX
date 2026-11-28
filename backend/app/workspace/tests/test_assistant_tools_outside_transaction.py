"""Tool sửa/xóa của Trợ lý chạy như request thật (không có transaction bao ngoài) không được lỗi 500.

`get_for_write` dùng `select_for_update` nên bắt buộc nằm trong transaction; test thường của pytest bọc sẵn
transaction nên không lộ lỗi — file này dùng `transaction=True` để tái hiện đúng môi trường request.
"""

from typing import Any

import pytest
from django.utils import timezone

from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.services.assistant_tools_service import AssistantToolsService

pytestmark = pytest.mark.django_db(transaction=True)


def test_update_and_two_step_delete_work_outside_transaction(user: Any) -> None:
    grant(user, ReminderPermission.UPDATE, ReminderPermission.DELETE, ReminderPermission.READ)
    actor = type(user).objects.get(pk=user.pk)
    reminder = Reminder.objects.create(owner=actor, title="Họp", due_date=timezone.localdate())
    conv = AssistantConversation.objects.create(owner=actor, channel=AssistantConversation.Channel.WEB)
    tools = AssistantToolsService()

    renamed = tools.execute_tool(
        actor, "update_reminder", {"reminder_id": str(reminder.pk), "title": "Họp team"}, is_owner=True
    )
    assert renamed["ok"] is True
    reminder.refresh_from_db()
    assert reminder.title == "Họp team"

    args = {"resource_type": "reminder", "record_id": str(reminder.pk)}
    step1 = tools.execute_tool(
        actor, "delete_personal_record", args, conversation_id=str(conv.pk), turn_id="t1"
    )
    assert step1["requires_confirmation"] is True
    step2 = tools.execute_tool(
        actor,
        "delete_personal_record",
        {**args, "confirmed": True},
        conversation_id=str(conv.pk),
        turn_id="t2",
    )
    assert step2["ok"] is True
