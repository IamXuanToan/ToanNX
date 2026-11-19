"""Kiểm thử endpoint danh sách người dùng: GET /api/v1/account/users."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/account/users"


class TestUserListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/account/users."""

    def test_list_success_paginated(self, superuser: User, login: Any) -> None:
        """Lấy danh sách người dùng có phân trang."""
        UserFactory.create_batch(3)
        api = login(superuser)

        items, pagination = self.assert_paginated(api.get(URL, {"page": 1, "page_size": 2}))
        assert len(items) == 2
        assert pagination["page"] == 1
        assert pagination["page_size"] == 2
        assert pagination["total"] >= 4  # superuser + 3 users

    def test_list_search_and_ordering(self, superuser: User, login: Any) -> None:
        """Tìm kiếm người dùng và sắp xếp danh sách."""
        api = login(superuser)
        UserFactory(email="findme-a@toannx.test", is_staff=True)
        UserFactory(email="findme-b@toannx.test", is_active=False)

        items, _ = self.assert_paginated(
            api.get(URL, {"page": 1, "search": "findme", "ordering": "-email"})
        )
        assert [item["email"] for item in items] == ["findme-b@toannx.test", "findme-a@toannx.test"]

    def test_list_filter_is_active(self, superuser: User, login: Any) -> None:
        """Lọc người dùng theo trạng thái hoạt động."""
        api = login(superuser)
        UserFactory(email="filter-active@toannx.test", is_active=True)
        UserFactory(email="filter-inactive@toannx.test", is_active=False)

        items, _ = self.assert_paginated(
            api.get(URL, {"page": 1, "search": "filter-", "is_active": "false"})
        )
        assert [item["email"] for item in items] == ["filter-inactive@toannx.test"]

    def test_list_page_out_of_range(self, superuser: User, login: Any) -> None:
        """Yêu cầu trang ngoài phạm vi tổng số trang trả về 404 NOT_FOUND."""
        res = login(superuser).get(URL, {"page": 999})
        self.assert_error(res, 404, "NOT_FOUND")

    def test_list_ordering_outside_whitelist_ignored(self, superuser: User, login: Any) -> None:
        """Trường sắp xếp không nằm trong whitelist bị bỏ qua và trả về thứ tự mặc định."""
        res = login(superuser).get(URL, {"page": 1, "ordering": "password"})
        self.assert_paginated(res)

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Người dùng thường thiếu quyền account.user.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
