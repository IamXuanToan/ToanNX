"""Kiểm thử endpoint danh sách short link: GET /api/v1/utilities/short-links."""

from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission as P
from app.utilities.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/short-links"


class TestShortLinkListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/short-links."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách link có phân trang."""
        grant(user, P.READ)
        ShortLinkFactory.create_batch(3, owner=user)
        api = login(user)

        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3
        assert pagination["page"] == 1
        assert pagination["page_size"] == 2

    def test_list_filter_status(self, user: Any, login: Any) -> None:
        """Lọc danh sách theo status (hỗ trợ nhiều giá trị và tính toán EXPIRED)."""
        grant(user, P.READ)
        l_active = ShortLinkFactory(owner=user, status=ShortLink.Status.ACTIVE)
        l_inactive = ShortLinkFactory(owner=user, status=ShortLink.Status.INACTIVE)
        l_expired = ShortLinkFactory(
            owner=user,
            status=ShortLink.Status.ACTIVE,
            expires_at=timezone.now() - timedelta(minutes=5),
        )
        api = login(user)

        # 1. Lọc ACTIVE
        items1, _ = self.assert_paginated(api.get(URL, {"status": "ACTIVE", "page": 1}))
        assert len(items1) == 1
        assert items1[0]["id"] == str(l_active.pk)

        # 2. Lọc nhiều giá trị EXPIRED,INACTIVE
        items2, _ = self.assert_paginated(api.get(URL, {"status": "EXPIRED,INACTIVE", "page": 1}))
        item_ids = {it["id"] for it in items2}
        assert str(l_inactive.pk) in item_ids
        assert str(l_expired.pk) in item_ids

        # 3. Lọc giá trị sai bị 400
        self.assert_error(api.get(URL, {"status": "INVALID_STATUS"}), 400, "VALIDATION_ERROR")

    def test_list_search(self, user: Any, login: Any) -> None:
        """Tìm kiếm theo tên, slug, destination_url."""
        grant(user, P.READ)
        ShortLinkFactory(owner=user, name="Khuyến Mãi Mùa Hè", slug="he-2026")
        ShortLinkFactory(owner=user, name="Tuyển Dụng", slug="tuyen-dung")
        api = login(user)

        res = api.get(URL, {"search": "Mùa Hè", "page": 1})
        items, _ = self.assert_paginated(res)
        assert len(items) == 1
        assert items[0]["name"] == "Khuyến Mãi Mùa Hè"

    def test_list_ordering(self, user: Any, login: Any) -> None:
        """Sắp xếp theo name hoặc created_at."""
        grant(user, P.READ)
        ShortLinkFactory(owner=user, name="B-Link", slug="b-link")
        ShortLinkFactory(owner=user, name="A-Link", slug="a-link")
        api = login(user)

        res = api.get(URL, {"ordering": "name", "page": 1})
        items, _ = self.assert_paginated(res)
        assert items[0]["name"] == "A-Link"
        assert items[1]["name"] == "B-Link"

    def test_list_owner_isolation_and_manage_all(self, user: Any, login: Any) -> None:
        """User thường chỉ thấy link của mình; có MANAGE_ALL thấy toàn bộ."""
        other_user = UserFactory()
        ShortLinkFactory(owner=user, name="Link Của Tôi")
        ShortLinkFactory(owner=other_user, name="Link Người Khác")

        # 1. Chỉ có READ: thấy 1 link của mình
        grant(user, P.READ)
        api = login(user)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination["total"] == 1
        assert items[0]["name"] == "Link Của Tôi"

        # 2. Có thêm MANAGE_ALL: thấy cả 2 links
        grant(user, P.MANAGE_ALL)
        api_managed = login(user)
        items_all, pagination_all = self.assert_paginated(api_managed.get(URL, {"page": 1}))
        assert pagination_all["total"] == 2

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.short_link.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)

    def test_list_response_envelope(self, user: Any, login: Any) -> None:
        """Response envelope có định dạng chuẩn success, meta, data."""
        grant(user, P.READ)
        api = login(user)

        res = api.get(URL, {"page": 1})
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert "pagination" in body["meta"]
        assert isinstance(body["data"], list)
