"""Đăng nhập phát `system.auth.login`; trình duyệt/IP mới (sau lần đầu) phát `system.auth.new_device`."""

from typing import Any

import pytest

from app.system.models.notification import Notification

pytestmark = pytest.mark.django_db


def test_login_and_new_device(user: Any, login: Any) -> None:
    login(user)
    login_notif = Notification.objects.get(recipient=user, event_code="system.auth.login")
    assert login_notif.link == "/portal/profile?profileTab=security"
    assert not Notification.objects.filter(
        event_code="system.auth.new_device"
    ).exists()  # lần đầu không cảnh báo
    login(user)
    assert not Notification.objects.filter(event_code="system.auth.new_device").exists()  # cùng thiết bị
    from rest_framework.test import APIClient

    other_device = APIClient(HTTP_USER_AGENT="Firefox lạ")
    login(user, client=other_device)
    new_dev_notif = Notification.objects.get(recipient=user, event_code="system.auth.new_device")
    assert new_dev_notif.link == "/portal/profile?profileTab=security"
