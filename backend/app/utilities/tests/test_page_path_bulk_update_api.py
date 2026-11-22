"""Kiểm thử endpoint cập nhật hàng loạt đường dẫn giữa: POST /api/v1/utilities/page-paths/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.page_path_permission import PagePathPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/page-paths/bulk-update"


def _make(owner: Any, n: int) -> PagePath:
    """Tạo đường dẫn giữa thứ `n` (tài nguyên dùng chung thì bỏ qua `owner`)."""
    return PagePath.objects.create(segment=f"duong-dan-{n}", name=f"Đường dẫn {n}")


class TestPagePathBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/page-paths/bulk-update."""

    def test_bulk_update_success(self, user: Any, login: Any) -> None:
        """Đổi cờ `is_active` của cả lô."""
        grant(user, P.PATH_UPDATE)
        items = [_make(user, 1), _make(user, 2)]
        api = login(user)

        payload = {"ids": [str(item.pk) for item in items], "is_active": False}
        data = self.assert_success(api.post(URL, payload, format="json"), 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.is_active is False

    def test_bulk_update_validation_errors(self, user: Any, login: Any) -> None:
        """Thiếu `ids` và cờ bị 400 VALIDATION_ERROR."""
        grant(user, P.PATH_UPDATE)
        api = login(user)

        error = self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"] and "is_active" in error["details"]

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": [], "is_active": False}, format="json"))

    def test_bulk_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền sửa bị 403."""
        self.assert_forbidden(login(user).post(URL, {"ids": [], "is_active": False}, format="json"))
