"""Kiểm thử endpoint chi tiết đường dẫn giữa: GET /api/v1/custom_pages/paths/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.custom_pages.permissions.page_path_permission import PagePathPermission as P
from app.modules.custom_pages.tests.helpers.page_test_helper import get_seeded_path
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/custom_pages/paths"


class TestPagePathDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/custom_pages/paths/{id}."""

    def test_detail_success(self, user: Any, login: Any) -> None:
        """Lấy chi tiết một PagePath thành công."""
        grant(user, P.PATH_READ)
        path = get_seeded_path("qr")
        api = login(user)

        res = api.get(f"{BASE_URL}/{path.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(path.pk)
        assert data["segment"] == "qr"

    def test_detail_not_found(self, user: Any, login: Any) -> None:
        """ID không tồn tại trả về 404 NOT_FOUND."""
        grant(user, P.PATH_READ)
        api = login(user)
        res = api.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền custom_pages.path.read bị 403."""
        path = get_seeded_path("qr")
        api = login(user)
        res = api.get(f"{BASE_URL}/{path.pk}")
        self.assert_forbidden(res)
