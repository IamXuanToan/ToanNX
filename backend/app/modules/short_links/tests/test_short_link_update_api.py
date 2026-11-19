"""Kiểm thử endpoint cập nhật short link: PATCH /api/v1/short_links/links/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_link_permission import ShortLinkPermission as P
from app.modules.short_links.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/short_links/links"


class TestShortLinkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/short_links/links/{id}."""

    def test_update_success_partial_fields(self, user: Any, login: Any) -> None:
        """Cập nhật một phần trường (tên, mô tả, status)."""
        grant(user, P.UPDATE)
        link = ShortLinkFactory(owner=user, name="Tên Cũ", status=ShortLink.Status.ACTIVE)
        api = login(user)

        payload = {"name": "Tên Mới", "status": "INACTIVE"}
        res = api.patch(f"{BASE_URL}/{link.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        assert data["name"] == "Tên Mới"
        assert data["status"] == "INACTIVE"

        link.refresh_from_db()
        assert link.name == "Tên Mới"
        assert link.status == ShortLink.Status.INACTIVE

    def test_update_password_and_clear(self, user: Any, login: Any) -> None:
        """Đặt mật khẩu mới rồi xóa mật khẩu (bằng chuỗi rỗng)."""
        grant(user, P.UPDATE)
        link = ShortLinkFactory(owner=user)
        api = login(user)

        from django.contrib.auth.hashers import check_password

        # 1. Đặt mật khẩu
        res1 = api.patch(f"{BASE_URL}/{link.pk}", {"password": "new-pass"}, format="json")
        data1 = self.assert_success(res1, 200)
        assert data1["has_password"] is True
        link.refresh_from_db()
        assert link.password_hash != "new-pass"
        assert check_password("new-pass", link.password_hash) is True

        # 2. Xóa mật khẩu (gửi chuỗi rỗng)
        res2 = api.patch(f"{BASE_URL}/{link.pk}", {"password": ""}, format="json")
        data2 = self.assert_success(res2, 200)
        assert data2["has_password"] is False
        link.refresh_from_db()
        assert link.password_hash == ""

    def test_update_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể sửa link của người khác (trả về 404 NOT_FOUND bảo mật)."""
        grant(user, P.UPDATE)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user, name="Link Gốc")

        api = login(user)
        res = api.patch(f"{BASE_URL}/{other_link.pk}", {"name": "Hack"}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        other_link.refresh_from_db()
        assert other_link.name == "Link Gốc"

    def test_update_manage_all_can_update_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì sửa được link của người khác."""
        grant(user, P.UPDATE, P.MANAGE_ALL)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user, name="Link Gốc")

        api = login(user)
        res = api.patch(f"{BASE_URL}/{other_link.pk}", {"name": "Admin Sửa"}, format="json")
        data = self.assert_success(res, 200)
        assert data["name"] == "Admin Sửa"

    def test_update_validation_invalid_url(self, user: Any, login: Any) -> None:
        """Validate lỗi khi cập nhật destination_url sai."""
        grant(user, P.UPDATE)
        link = ShortLinkFactory(owner=user)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{link.pk}", {"destination_url": "javascript:alert(1)"}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(f"{BASE_URL}/00000000-0000-0000-0000-000000000000", {}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền short_links.link.update bị 403."""
        link = ShortLinkFactory(owner=user)
        api = login(user)
        res = api.patch(f"{BASE_URL}/{link.pk}", {"name": "Đổi Tên"}, format="json")
        self.assert_forbidden(res)
