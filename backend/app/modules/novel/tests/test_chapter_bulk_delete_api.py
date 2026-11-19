"""Kiểm thử endpoint xóa lô chương: POST /api/v1/novel/chapters/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.chapter_permission import ChapterPermission
from app.modules.novel.tests.factories.chapter_factory import ChapterFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/chapters/bulk-delete"


class TestChapterBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/chapters/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa lô danh sách chương thành công."""
        chapters = ChapterFactory.create_batch(3)
        grant(user, ChapterPermission.DELETE)
        api = login(user)

        payload = {"ids": [str(c.pk) for c in chapters]}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 3
        for c in chapters:
            c.refresh_from_db()
            assert c.deleted_at is not None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.chapter.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
