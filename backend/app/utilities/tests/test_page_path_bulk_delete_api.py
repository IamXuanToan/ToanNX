"""Kiểm thử endpoint xóa lô đường dẫn giữa: POST /api/v1/utilities/page-paths/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.page_path_permission import PagePathPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/page-paths/bulk-delete"


def _make(owner: Any, n: int) -> PagePath:
    """Tạo đường dẫn giữa thứ `n` (tài nguyên dùng chung thì bỏ qua `owner`)."""
    return PagePath.objects.create(segment=f"duong-dan-{n}", name=f"Đường dẫn {n}")


class TestPagePathBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/page-paths/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm cả lô thành công, trả số bản ghi đã xử lý."""
        grant(user, P.PATH_DELETE)
        items = [_make(user, 1), _make(user, 2)]
        api = login(user)

        res = api.post(URL, {"ids": [str(item.pk) for item in items]}, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.deleted_at is not None

    def test_bulk_delete_validation_missing_ids(self, user: Any, login: Any) -> None:
        """Thiếu `ids` bị 400 VALIDATION_ERROR."""
        grant(user, P.PATH_DELETE)
        api = login(user)

        error = self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": []}, format="json"))

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền xóa bị 403."""
        self.assert_forbidden(login(user).post(URL, {"ids": []}, format="json"))
