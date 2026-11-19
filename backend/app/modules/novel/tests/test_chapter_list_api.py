"""Kiểm thử endpoint danh sách chương: GET /api/v1/novel/chapters."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.chapter_permission import ChapterPermission
from app.modules.novel.tests.factories.chapter_factory import ChapterFactory
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/chapters"


class TestChapterListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/chapters."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách chương có phân trang."""
        novel = NovelFactory()
        ChapterFactory.create_batch(3, novel=novel)

        grant(user, ChapterPermission.READ)
        api = login(user)

        res = api.get(URL, {"novel_id": str(novel.pk), "page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3

    def test_list_filter_by_novel(self, user: Any, login: Any) -> None:
        """Lọc chương theo novel_id."""
        n1 = NovelFactory()
        n2 = NovelFactory()
        ChapterFactory.create_batch(2, novel=n1)
        ChapterFactory.create_batch(3, novel=n2)

        grant(user, ChapterPermission.READ)
        api = login(user)

        res = api.get(URL, {"novel_id": str(n1.pk), "page": 1})
        items, pagination = self.assert_paginated(res)
        assert pagination["total"] == 2
        for it in items:
            assert it["novel_id"] == str(n1.pk)

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.chapter.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
