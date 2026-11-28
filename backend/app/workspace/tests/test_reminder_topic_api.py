"""Kiểm thử API Chủ đề nhắc việc: /api/v1/workspace/reminder-topics."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder_topic import ReminderTopic
from app.workspace.permissions.reminder_topic_permission import ReminderTopicPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/reminder-topics"


class TestReminderTopicApi(BaseApiTestCase):
    """Kiểm thử CRUD Chủ đề nhắc việc, chủ đề mặc định hệ thống & cô lập owner."""

    def test_list_create_update_delete_and_system_protection(
        self,
        user: Any,
        staff: Any,
        login: Any,
        client: Any,
    ) -> None:
        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, *P.member())
        grant(staff, *P.member())
        api = login(user)
        other_api = login(staff)

        # Danh sách chứa chủ đề mặc định hệ thống
        list_res = api.get(URL)
        data = self.assert_success(list_res, 200)
        items = data["items"] if isinstance(data, dict) else data
        names = [item["name"] for item in items]
        assert "Công việc" in names
        assert "Ngày kỷ niệm" in names
        assert "Ngày giỗ" in names

        # Tạo chủ đề cá nhân
        create_res = api.post(
            URL,
            {"name": "Dự án riêng", "color": "#2563eb", "sort_order": 10},
            format="json",
        )
        created = self.assert_success(create_res, 201)
        assert created["name"] == "Dự án riêng"
        assert created["color"] == "#2563eb"
        assert created["is_system"] is False
        topic_id = created["id"]

        # Người khác không thấy / không sửa được chủ đề cá nhân của user
        other_data = self.assert_success(other_api.get(URL), 200)
        other_list = other_data["items"] if isinstance(other_data, dict) else other_data
        assert all(item["id"] != topic_id for item in other_list)
        assert other_api.patch(f"{URL}/{topic_id}", {"name": "Hack"}, format="json").status_code in (403, 404)

        # Sửa chủ đề cá nhân
        patch_res = api.patch(f"{URL}/{topic_id}", {"name": "Dự án A", "color": "#16a34a"}, format="json")
        patched = self.assert_success(patch_res, 200)
        assert patched["name"] == "Dự án A"
        assert patched["color"] == "#16a34a"

        # Chặn sửa / xóa chủ đề mặc định hệ thống
        sys_topic = ReminderTopic.objects.filter(is_system=True).first()
        assert sys_topic is not None
        sys_patch = api.patch(f"{URL}/{sys_topic.pk}", {"name": "Đổi tên"}, format="json")
        self.assert_error(sys_patch, 422, "WORKSPACE_REMINDER_TOPIC_SYSTEM_PROTECTED")
        sys_delete = api.delete(f"{URL}/{sys_topic.pk}")
        self.assert_error(sys_delete, 422, "WORKSPACE_REMINDER_TOPIC_SYSTEM_PROTECTED")

        # Xóa chủ đề cá nhân
        del_res = api.delete(f"{URL}/{topic_id}")
        assert del_res.status_code in (200, 204)
        assert ReminderTopic.objects.filter(pk=topic_id, deleted_at__isnull=True).count() == 0
