"""Kiểm thử endpoint danh sách tiểu thuyết: GET /api/v1/novel/novels."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.novel_permission import NovelPermission
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/novels"


class TestNovelListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/novels."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách tiểu thuyết có phân trang."""
        grant(user, NovelPermission.READ)
        NovelFactory.create_batch(3, owner=user)
        api = login(user)

        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3
        assert pagination["page"] == 1
        assert pagination["page_size"] == 2
        assert pagination["total_pages"] == 2

    def test_list_filter_status(self, user: Any, login: Any) -> None:
        """Lọc danh sách theo trạng thái (status)."""
        grant(user, NovelPermission.READ)
        NovelFactory(owner=user, status="COMPLETED")
        NovelFactory(owner=user, status="ONGOING")
        api = login(user)

        res = api.get(URL, {"status": "COMPLETED", "page": 1})
        items, _ = self.assert_paginated(res)
        assert len(items) == 1
        assert items[0]["status"] == "COMPLETED"

    def test_list_search(self, user: Any, login: Any) -> None:
        """Tìm kiếm tiểu thuyết theo từ khóa (tiêu đề)."""
        grant(user, NovelPermission.READ)
        NovelFactory(owner=user, title="Đấu Phá Thương Khung")
        NovelFactory(owner=user, title="Vũ Động Càn Khôn")
        api = login(user)

        res = api.get(URL, {"search": "Đấu Phá", "page": 1})
        items, _ = self.assert_paginated(res)
        assert len(items) == 1
        assert items[0]["title"] == "Đấu Phá Thương Khung"

    def test_list_ordering(self, user: Any, login: Any) -> None:
        """Sắp xếp danh sách theo tiêu đề."""
        grant(user, NovelPermission.READ)
        NovelFactory(owner=user, title="B Truyện")
        NovelFactory(owner=user, title="A Truyện")
        api = login(user)

        res = api.get(URL, {"ordering": "title", "page": 1})
        items, _ = self.assert_paginated(res)
        assert items[0]["title"] == "A Truyện"
        assert items[1]["title"] == "B Truyện"

    def test_list_owner_isolation_and_manage_all(self, user: Any, login: Any) -> None:
        """Người dùng thường chỉ thấy truyện của mình; có MANAGE_ALL thấy tất cả."""
        other_user = UserFactory()
        NovelFactory(owner=user, title="Truyện Của Tôi")
        NovelFactory(owner=other_user, title="Truyện Người Khác")

        # 1. Chỉ có quyền READ: chỉ thấy truyện của chính mình
        grant(user, NovelPermission.READ)
        api = login(user)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination["total"] == 1
        assert items[0]["title"] == "Truyện Của Tôi"

        # 2. Thêm quyền MANAGE_ALL: thấy toàn bộ truyện
        grant(user, NovelPermission.MANAGE_ALL)
        items_all, pagination_all = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination_all["total"] == 2

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.novel.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)

    def test_list_response_envelope(self, user: Any, login: Any) -> None:
        """Kiểm tra envelope response chuẩn."""
        grant(user, NovelPermission.READ)
        api = login(user)

        res = api.get(URL, {"page": 1})
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert "pagination" in body["meta"]
        assert isinstance(body["data"], list)
