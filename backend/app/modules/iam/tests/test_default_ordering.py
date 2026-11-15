"""Danh sách IAM mặc định mới nhất trước, vẫn cho chọn sắp xếp khác."""

from typing import Any

import pytest

from app.modules.iam.models.role import Role

pytestmark = pytest.mark.django_db


def test_roles_default_to_newest_first(superuser: Any, login: Any) -> None:
    """Thứ tự mặc định theo thời điểm tạo, không theo mã vai trò."""
    older = Role.objects.create(code="ORDER_A", name="Ordering older")
    newer = Role.objects.create(code="ORDER_Z", name="Ordering newer")
    client = login(superuser)
    url = "/api/v1/iam/roles"
    response = client.get(url, {"search": "ORDER_"})
    assert [item["id"] for item in response.json()["data"]] == [str(newer.pk), str(older.pk)]
    response = client.get(url, {"search": "ORDER_", "ordering": "code"})
    assert [item["id"] for item in response.json()["data"]] == [str(older.pk), str(newer.pk)]
