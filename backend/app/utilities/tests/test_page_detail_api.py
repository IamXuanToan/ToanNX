"""Kiểm thử endpoint chi tiết trang: GET /api/v1/utilities/pages/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/pages"


class TestPageDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/pages/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết trang của chính mình thành công."""
        grant(user, P.READ)
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Chi Tiết Trang", slug="detail-page")
        api = login(user)

        res = api.get(f"{BASE_URL}/{page.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(page.pk)
        assert data["title"] == "Chi Tiết Trang"
        assert data["slug"] == "detail-page"
        assert data["owner"]["id"] == str(user.pk)

    def test_detail_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xem chi tiết trang của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.READ)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Trang Người Khác", slug="other")

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_page.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_manage_all_can_access_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì xem được trang của người khác."""
        grant(user, P.READ, P.MANAGE_ALL)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Trang Người Khác", slug="other")

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_page.pk}")
        data = self.assert_success(res, 200)
        assert data["id"] == str(other_page.pk)

    def test_detail_not_found(self, user: Any, login: Any) -> None:
        """ID không tồn tại trả về 404 NOT_FOUND."""
        grant(user, P.READ)
        api = login(user)
        res = api.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page.read bị 403."""
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang", slug="p")
        api = login(user)
        res = api.get(f"{BASE_URL}/{page.pk}")
        self.assert_forbidden(res)
