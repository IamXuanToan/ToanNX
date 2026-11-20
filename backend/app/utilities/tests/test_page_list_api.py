"""Kiểm thử endpoint danh sách trang: GET /api/v1/utilities/pages."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/pages"


class TestPageListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/pages."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách trang có phân trang."""
        grant(user, P.READ)
        path = get_seeded_path("p")
        for i in range(3):
            Page.objects.create(owner=user, path=path, title=f"Page {i}", slug=f"page-{i}")

        api = login(user)
        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3
        assert pagination["page"] == 1
        assert pagination["page_size"] == 2

    def test_list_filter_status(self, user: Any, login: Any) -> None:
        """Lọc danh sách theo trạng thái (DRAFT / PUBLISHED)."""
        grant(user, P.READ)
        path = get_seeded_path("p")
        p1 = Page.objects.create(owner=user, path=path, title="P1", slug="p1", status=Page.Status.DRAFT)
        Page.objects.create(owner=user, path=path, title="P2", slug="p2", status=Page.Status.PUBLISHED)

        api = login(user)
        items, _ = self.assert_paginated(api.get(URL, {"status": "DRAFT", "page": 1}))
        assert len(items) == 1
        assert items[0]["id"] == str(p1.pk)

    def test_list_filter_path(self, user: Any, login: Any) -> None:
        """Lọc danh sách theo path segment."""
        grant(user, P.READ)
        p_path = get_seeded_path("p")
        qr_path = get_seeded_path("qr")
        Page.objects.create(owner=user, path=p_path, title="P-Page", slug="p-page")
        Page.objects.create(owner=user, path=qr_path, title="QR-Page", slug="qr-page")

        api = login(user)
        items, _ = self.assert_paginated(api.get(URL, {"path": str(qr_path.pk), "page": 1}))
        assert len(items) == 1
        assert items[0]["slug"] == "qr-page"

    def test_list_search(self, user: Any, login: Any) -> None:
        """Tìm kiếm theo title hoặc slug."""
        grant(user, P.READ)
        path = get_seeded_path("p")
        Page.objects.create(owner=user, path=path, title="Điều Khoản Sử Dụng", slug="terms")
        Page.objects.create(owner=user, path=path, title="Chính Sách Bảo Mật", slug="privacy")

        api = login(user)
        items, _ = self.assert_paginated(api.get(URL, {"search": "Điều Khoản", "page": 1}))
        assert len(items) == 1
        assert items[0]["slug"] == "terms"

    def test_list_owner_isolation_and_manage_all(self, user: Any, login: Any) -> None:
        """User thường chỉ thấy trang của mình; có MANAGE_ALL thấy toàn bộ."""
        other_user = UserFactory()
        path = get_seeded_path("p")
        Page.objects.create(owner=user, path=path, title="Trang Của Tôi", slug="mine")
        Page.objects.create(owner=other_user, path=path, title="Trang Người Khác", slug="theirs")

        # 1. Chỉ có READ: thấy 1 trang của mình
        grant(user, P.READ)
        api = login(user)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination["total"] == 1
        assert items[0]["title"] == "Trang Của Tôi"

        # 2. Có MANAGE_ALL: thấy cả 2 trang
        grant(user, P.MANAGE_ALL)
        api_managed = login(user)
        items_all, pagination_all = self.assert_paginated(api_managed.get(URL, {"page": 1}))
        assert pagination_all["total"] == 2

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)

    def test_list_response_envelope(self, user: Any, login: Any) -> None:
        """Kiểm tra envelope response chuẩn."""
        grant(user, P.READ)
        api = login(user)

        res = api.get(URL, {"page": 1})
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert "pagination" in body["meta"]
        assert isinstance(body["data"], list)
