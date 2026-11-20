"""Hợp đồng tên người dùng bắt buộc ở API."""

from typing import Any

import pytest

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("username", [None, "", "   "])
def test_create_requires_username(superuser: Any, login: Any, username: Any) -> None:
    """Thiếu tên hoặc chỉ có khoảng trắng đều bị từ chối."""
    payload = {"email": "required@example.test", "password": "Strong-Password-123!"}
    if username is not None:
        payload["username"] = username
    response = login(superuser).post("/api/v1/account/users", payload, content_type="application/json")
    assert response.status_code == 400
    assert "username" in response.json()["error"]["details"]


def test_update_rejects_empty_username(superuser: Any, user: Any, login: Any) -> None:
    """PATCH không cho xóa tên người dùng thành rỗng."""
    response = login(superuser).patch(
        f"/api/v1/account/users/{user.pk}",
        {"username": " "},
        content_type="application/json",
    )
    assert response.status_code == 400
