"""Thông báo hệ thống: gửi theo vai trò vào tab Hệ thống, thu hồi khỏi chuông."""

from typing import Any

import pytest

from app.system.models.notification import Notification
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/announcements"


def test_send_to_role_and_revoke(superuser: Any, login: Any) -> None:
    member, outsider = UserFactory(), UserFactory()
    role = grant(member, "system.notification.read")
    api = login(superuser)
    response = api.post(
        URL,
        {"title": "Bảo trì", "target": "ROLES", "role_ids": [str(role.pk)], "level": "WARNING"},
        format="json",
    )
    assert response.status_code == 201 and response.json()["data"]["recipient_count"] == 1
    notification = Notification.objects.get(scope="SYSTEM")
    assert (
        notification.recipient_id == member.pk
        and notification.scope == "SYSTEM"
        and notification.level == "WARNING"
    )
    assert not Notification.objects.filter(recipient=outsider).exists()
    assert api.delete(f"{URL}/{response.json()['data']['id']}").status_code == 204
    assert not Notification.objects.filter(scope="SYSTEM").exists()


def test_external_link_rejected(superuser: Any, login: Any) -> None:
    response = login(superuser).post(
        URL, {"title": "x", "target": "ALL", "link": "https://evil.test"}, format="json"
    )
    assert response.status_code == 400
