"""Kiểm thử endpoint danh sách vai trò: GET /api/v1/system/roles."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.user import User

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/roles"


class TestRoleListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/system/roles."""

    def test_list_roles_success_paginated(self, superuser: User, login: Any) -> None:
        """Lấy danh sách vai trò có phân trang (mặc định có vai trò hệ thống ADMIN)."""
        api = login(superuser)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))

        assert pagination["total"] >= 1
        assert "ADMIN" in {item["code"] for item in items}

    def test_list_roles_filter_auto_grant_and_is_system(self, superuser: User, login: Any) -> None:
        """Lọc theo auto_grant và is_system."""
        api = login(superuser)

        items_admin, _ = self.assert_paginated(api.get(URL, {"page": 1, "auto_grant": "all"}))
        assert [item["code"] for item in items_admin] == ["ADMIN"]

        items_multi, _ = self.assert_paginated(
            api.get(URL, {"page": 1, "auto_grant": "all,read_only", "is_system": "true"})
        )
        assert {item["code"] for item in items_multi} == {"ADMIN"}
        assert all(item["auto_grant"] in {"all", "read_only"} for item in items_multi)

    def test_list_roles_search_by_name(self, superuser: User, login: Any) -> None:
        """Tìm kiếm vai trò theo tên hiển thị."""
        api = login(superuser)
        items, _ = self.assert_paginated(api.get(URL, {"page": 1, "search": "Quản trị viên"}))
        assert [item["code"] for item in items] == ["ADMIN"]

    def test_list_roles_sort_by_permission_count(self, superuser: User, login: Any) -> None:
        """Sắp xếp vai trò theo số lượng quyền (-permission_count)."""
        api = login(superuser)
        items, _ = self.assert_paginated(api.get(URL, {"page": 1, "ordering": "-permission_count"}))
        counts = [item["permission_count"] for item in items]
        assert counts == sorted(counts, reverse=True)

    def test_list_roles_invalid_filter_rejected(self, superuser: User, login: Any) -> None:
        """Giá trị bộ lọc auto_grant không hợp lệ bị 400 VALIDATION_ERROR."""
        api = login(superuser)
        error = self.assert_error(api.get(URL, {"auto_grant": "maybe"}), 400, "VALIDATION_ERROR")
        assert "auto_grant" in error["details"]

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.role.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
