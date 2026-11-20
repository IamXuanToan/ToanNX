"""Kiểm thử endpoint xóa trang: DELETE /api/v1/utilities/pages/{id}."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/pages"


class TestPageDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/utilities/pages/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm trang thành công (204 No Content)."""
        grant(user, P.DELETE)
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang Xóa", slug="to-delete")
        api = login(user)

        res = api.delete(f"{BASE_URL}/{page.pk}")
        assert res.status_code == 204

        page.refresh_from_db()
        assert page.deleted_at is not None
        assert page.deleted_by_id == user.pk

    def test_delete_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xóa trang của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.DELETE)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Trang Khác", slug="other")

        api = login(user)
        res = api.delete(f"{BASE_URL}/{other_page.pk}")
        self.assert_error(res, 404, "NOT_FOUND")

        other_page.refresh_from_db()
        assert other_page.deleted_at is None

    def test_delete_manage_all_can_delete_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì xóa được trang của người khác."""
        grant(user, P.DELETE, P.MANAGE_ALL)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Trang Khác", slug="other")

        api = login(user)
        res = api.delete(f"{BASE_URL}/{other_page.pk}")
        assert res.status_code == 204

        other_page.refresh_from_db()
        assert other_page.deleted_at is not None

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page.delete bị 403."""
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang", slug="p")
        api = login(user)
        res = api.delete(f"{BASE_URL}/{page.pk}")
        self.assert_forbidden(res)
