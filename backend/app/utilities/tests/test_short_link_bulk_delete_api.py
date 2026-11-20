"""Kiểm thử endpoint xóa hàng loạt short link: POST /api/v1/utilities/short-links/bulk-delete."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.short_link_permission import ShortLinkPermission as P
from app.utilities.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/short-links/bulk-delete"


class TestShortLinkBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/short-links/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm hàng loạt link thành công trong một transaction."""
        grant(user, P.DELETE)
        l1 = ShortLinkFactory(owner=user)
        l2 = ShortLinkFactory(owner=user)
        api = login(user)

        res = api.post(URL, {"ids": [str(l1.pk), str(l2.pk)]}, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

        l1.refresh_from_db()
        l2.refresh_from_db()
        assert l1.deleted_at is not None
        assert l2.deleted_at is not None

    def test_bulk_delete_owner_isolation_other_user_404_rollback(self, user: Any, login: Any) -> None:
        """Lô xóa có chứa link của người khác sẽ bị từ chối 404 và rollback toàn bộ."""
        grant(user, P.DELETE)
        other_user = UserFactory()
        l_own = ShortLinkFactory(owner=user)
        l_other = ShortLinkFactory(owner=other_user)
        api = login(user)

        res = api.post(URL, {"ids": [str(l_own.pk), str(l_other.pk)]}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        # Rollback toàn bộ, link của mình vẫn chưa bị xóa
        l_own.refresh_from_db()
        l_other.refresh_from_db()
        assert l_own.deleted_at is None
        assert l_other.deleted_at is None

    def test_bulk_delete_manage_all_can_bulk_delete_any(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì được xóa hàng loạt link của bất kỳ người dùng nào."""
        grant(user, P.DELETE, P.MANAGE_ALL)
        other_user = UserFactory()
        l1 = ShortLinkFactory(owner=user)
        l2 = ShortLinkFactory(owner=other_user)
        api = login(user)

        res = api.post(URL, {"ids": [str(l1.pk), str(l2.pk)]}, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

        l1.refresh_from_db()
        l2.refresh_from_db()
        assert l1.deleted_at is not None
        assert l2.deleted_at is not None

    def test_bulk_delete_validation_missing_ids(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu trường ids."""
        grant(user, P.DELETE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.short_link.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
