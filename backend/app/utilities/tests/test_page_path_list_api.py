"""Kiểm thử endpoint danh sách đường dẫn giữa: GET /api/v1/utilities/page-paths."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.page_path_permission import PagePathPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/page-paths"


class TestPagePathListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/page-paths."""

    def test_list_success(self, user: Any, login: Any) -> None:
        """Lấy danh sách các đường dẫn giữa (mặc định có p và qr đã seed)."""
        grant(user, P.PATH_READ)
        api = login(user)

        res = api.get(URL)
        data = self.assert_success(res, 200)

        assert isinstance(data, list)
        segments = [item["segment"] for item in data]
        assert "p" in segments
        assert "qr" in segments

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page_path.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
