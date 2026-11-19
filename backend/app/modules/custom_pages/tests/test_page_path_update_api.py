"""Kiểm thử endpoint cập nhật đường dẫn giữa: PATCH /api/v1/custom_pages/paths/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.custom_pages.models.page_path import PagePath
from app.modules.custom_pages.permissions.page_path_permission import PagePathPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/custom_pages/paths"


class TestPagePathUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/custom_pages/paths/{id}."""

    def test_update_success(self, user: Any, login: Any) -> None:
        """Cập nhật tên và trạng thái hoạt động của PagePath thành công."""
        grant(user, P.PATH_UPDATE)
        path = PagePath.objects.create(segment="temp-update", name="Tên Cũ", is_active=True)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{path.pk}", {"name": "Tên Mới", "is_active": False}, format="json")
        data = self.assert_success(res, 200)

        assert data["name"] == "Tên Mới"
        assert data["is_active"] is False

        path.refresh_from_db()
        assert path.name == "Tên Mới"
        assert path.is_active is False

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(f"{BASE_URL}/00000000-0000-0000-0000-000000000000", {}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền custom_pages.path.update bị 403."""
        path = PagePath.objects.create(segment="temp-forbid", name="Cấm")
        api = login(user)
        res = api.patch(f"{BASE_URL}/{path.pk}", {"name": "Đổi"}, format="json")
        self.assert_forbidden(res)
