"""Kiểm thử endpoint xóa đường dẫn giữa: DELETE /api/v1/utilities/page-paths/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.page_path_permission import PagePathPermission as P

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/page-paths"


class TestPagePathDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/utilities/page-paths/{id}."""

    def test_delete_empty_path_success(self, user: Any, login: Any) -> None:
        """Xóa đường dẫn giữa không chứa trang nào thành công (204 No Content)."""
        grant(user, P.PATH_DELETE)
        path = PagePath.objects.create(segment="empty-path", name="Trống")
        api = login(user)

        res = api.delete(f"{BASE_URL}/{path.pk}")
        assert res.status_code == 204

        path.refresh_from_db()
        assert path.deleted_at is not None

    def test_delete_in_use_path_rejected_409(self, user: Any, login: Any) -> None:
        """Không thể xóa đường dẫn giữa đang có trang sử dụng (409 UTILITIES_PAGE_PATH_IN_USE)."""
        grant(user, P.PATH_DELETE)
        path = PagePath.objects.create(segment="busy-path", name="Đang Dùng")
        Page.objects.create(owner=user, path=path, title="Trang 1", slug="trang-1")

        api = login(user)
        res = api.delete(f"{BASE_URL}/{path.pk}")
        self.assert_error(res, 409, "UTILITIES_PAGE_PATH_IN_USE")

        path.refresh_from_db()
        assert path.deleted_at is None

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page_path.delete bị 403."""
        path = PagePath.objects.create(segment="forbid-del", name="Cấm Xóa")
        api = login(user)
        res = api.delete(f"{BASE_URL}/{path.pk}")
        self.assert_forbidden(res)
