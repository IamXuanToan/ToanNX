"""Kiểm thử endpoint chi tiết short link: GET /api/v1/short_links/links/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.short_links.permissions.short_link_permission import ShortLinkPermission as P
from app.modules.short_links.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/short_links/links"


class TestShortLinkDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/short_links/links/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết short link của chính mình thành công."""
        grant(user, P.READ)
        link = ShortLinkFactory(owner=user, name="Chi Tiết Link", slug="chi-tiet")
        api = login(user)

        res = api.get(f"{BASE_URL}/{link.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(link.pk)
        assert data["name"] == "Chi Tiết Link"
        assert data["slug"] == "chi-tiet"
        assert data["owner_id"] == str(user.pk)

    def test_detail_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xem chi tiết link của người khác (trả về 404 NOT_FOUND bảo mật)."""
        grant(user, P.READ)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user)

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_link.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_manage_all_can_access_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì xem được link của người khác."""
        grant(user, P.READ, P.MANAGE_ALL)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user)

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_link.pk}")
        data = self.assert_success(res, 200)
        assert data["id"] == str(other_link.pk)

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
        """Đã đăng nhập nhưng thiếu quyền short_links.link.read bị 403."""
        link = ShortLinkFactory(owner=user)
        api = login(user)
        res = api.get(f"{BASE_URL}/{link.pk}")
        self.assert_forbidden(res)
