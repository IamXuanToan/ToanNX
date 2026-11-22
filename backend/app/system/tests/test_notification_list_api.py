"""Chuông: danh sách theo tab, số chưa đọc, đánh dấu đã đọc, ẩn, chỉ của mình."""

from typing import Any

import pytest

from app.system.models.notification import Notification
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db


def _make(user: Any, scope: str, key: str) -> Notification:
    return Notification.objects.create(
        recipient=user, scope=scope, event_code="system.auth.login", module="system", title=key, dedup_key=key
    )


def test_bell_tabs_and_read(superuser: Any, login: Any) -> None:
    api = login(superuser)
    Notification.objects.filter(recipient=superuser).delete()  # bỏ thông báo "đăng nhập mới" do login tạo
    _make(superuser, "PERSONAL", "a")
    personal = _make(superuser, "PERSONAL", "b")
    _make(superuser, "SYSTEM", "c")
    _make(UserFactory(), "PERSONAL", "x")
    assert api.get("/api/v1/system/notifications/unread-count").json()["data"] == {"personal": 2, "system": 1}
    assert len(api.get("/api/v1/system/notifications", {"scope": "PERSONAL"}).json()["data"]) == 2
    assert api.post(f"/api/v1/system/notifications/{personal.pk}/read").status_code == 200
    counts = api.post("/api/v1/system/notifications/read-all", {"scope": "PERSONAL"}, format="json").json()[
        "data"
    ]
    assert counts == {"personal": 0, "system": 1}
    assert api.delete(f"/api/v1/system/notifications/{personal.pk}").status_code == 204


def test_cannot_touch_others(superuser: Any, login: Any) -> None:
    other = _make(UserFactory(), "PERSONAL", "x")
    api = login(superuser)
    assert api.post(f"/api/v1/system/notifications/{other.pk}/read").status_code == 404
