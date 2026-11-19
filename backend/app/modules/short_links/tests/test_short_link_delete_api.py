"""Kiểm thử endpoint xóa short link: DELETE /api/v1/short_links/links/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.short_links.permissions.short_link_permission import ShortLinkPermission as P
from app.modules.short_links.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/short_links/links"


class TestShortLinkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/short_links/links/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm link thành công (204 No Content)."""
        grant(user, P.DELETE)
        link = ShortLinkFactory(owner=user)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{link.pk}")
        assert res.status_code == 204

        link.refresh_from_db()
        assert link.deleted_at is not None
        assert link.deleted_by_id == user.pk

    def test_delete_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xóa link của người khác (trả về 404 NOT_FOUND bảo mật)."""
        grant(user, P.DELETE)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user)

        api = login(user)
        res = api.delete(f"{BASE_URL}/{other_link.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

        other_link.refresh_from_db()
        assert other_link.deleted_at is None

    def test_delete_manage_all_can_delete_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì xóa được link của người khác."""
        grant(user, P.DELETE, P.MANAGE_ALL)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user)

        api = login(user)
        res = api.delete(f"{BASE_URL}/{other_link.pk}")
        assert res.status_code == 204

        other_link.refresh_from_db()
        assert other_link.deleted_at is not None

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền short_links.link.delete bị 403."""
        link = ShortLinkFactory(owner=user)
        api = login(user)
        res = api.delete(f"{BASE_URL}/{link.pk}")
        self.assert_forbidden(res)
