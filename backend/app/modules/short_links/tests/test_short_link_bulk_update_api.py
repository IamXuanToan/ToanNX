"""Kiểm thử endpoint cập nhật hàng loạt short link: POST /api/v1/short_links/links/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_link_permission import ShortLinkPermission as P
from app.modules.short_links.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/short_links/links/bulk-update"


class TestShortLinkBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/short_links/links/bulk-update."""

    def test_bulk_update_success(self, user: Any, login: Any) -> None:
        """Cập nhật trạng thái hàng loạt link của chính mình thành công."""
        grant(user, P.UPDATE)
        l1 = ShortLinkFactory(owner=user, status=ShortLink.Status.ACTIVE)
        l2 = ShortLinkFactory(owner=user, status=ShortLink.Status.ACTIVE)
        api = login(user)

        payload = {"ids": [str(l1.pk), str(l2.pk)], "status": "INACTIVE"}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2

        l1.refresh_from_db()
        l2.refresh_from_db()
        assert l1.status == ShortLink.Status.INACTIVE
        assert l2.status == ShortLink.Status.INACTIVE

    def test_bulk_update_owner_isolation(self, user: Any, login: Any) -> None:
        """Không thể cập nhật link của người khác qua bulk-update."""
        grant(user, P.UPDATE)
        other_user = UserFactory()
        l_own = ShortLinkFactory(owner=user, status=ShortLink.Status.ACTIVE)
        l_other = ShortLinkFactory(owner=other_user, status=ShortLink.Status.ACTIVE)
        api = login(user)

        # Chứa ID của người khác -> 404 NOT_FOUND bảo mật (transaction rollback)
        payload = {"ids": [str(l_own.pk), str(l_other.pk)], "status": "INACTIVE"}
        res = api.post(URL, payload, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        l_own.refresh_from_db()
        l_other.refresh_from_db()
        assert l_own.status == ShortLink.Status.ACTIVE
        assert l_other.status == ShortLink.Status.ACTIVE

    def test_bulk_update_validation_missing_ids_or_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu ids hoặc không có trường nào để cập nhật."""
        grant(user, P.UPDATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": [], "status": "INACTIVE"}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền short_links.link.update bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": [], "status": "INACTIVE"}, format="json")
        self.assert_forbidden(res)
