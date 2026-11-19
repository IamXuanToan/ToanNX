"""Kiểm thử endpoint xóa hàng loạt trang: POST /api/v1/custom_pages/pages/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.permissions.page_permission import PagePermission as P
from app.modules.custom_pages.tests.helpers.page_test_helper import get_seeded_path
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/custom_pages/pages/bulk-delete"


class TestPageBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/custom_pages/pages/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm hàng loạt trang của mình thành công."""
        grant(user, P.DELETE)
        path = get_seeded_path("p")
        p1 = Page.objects.create(owner=user, path=path, title="P1", slug="del-1")
        p2 = Page.objects.create(owner=user, path=path, title="P2", slug="del-2")

        api = login(user)
        res = api.post(URL, {"ids": [str(p1.pk), str(p2.pk)]}, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

        p1.refresh_from_db()
        p2.refresh_from_db()
        assert p1.deleted_at is not None
        assert p2.deleted_at is not None

    def test_bulk_delete_owner_isolation_other_user_404_rollback(self, user: Any, login: Any) -> None:
        """Lô xóa có chứa trang của người khác sẽ bị từ chối 404 và rollback toàn bộ."""
        grant(user, P.DELETE)
        other_user = UserFactory()
        path = get_seeded_path("p")
        p_own = Page.objects.create(owner=user, path=path, title="Mine", slug="del-mine")
        p_other = Page.objects.create(owner=other_user, path=path, title="Theirs", slug="del-theirs")

        api = login(user)
        res = api.post(URL, {"ids": [str(p_own.pk), str(p_other.pk)]}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        p_own.refresh_from_db()
        p_other.refresh_from_db()
        assert p_own.deleted_at is None
        assert p_other.deleted_at is None

    def test_bulk_delete_validation_missing_ids(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu ids."""
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
        """Đã đăng nhập nhưng thiếu quyền custom_pages.page.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
