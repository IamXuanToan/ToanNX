"""Kiểm thử endpoint xóa chương: DELETE /api/v1/novel/chapters/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.models.chapter import Chapter
from app.novel.permissions.chapter_permission import ChapterPermission
from app.novel.tests.factories.chapter_factory import ChapterFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/chapters"


class TestChapterDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/chapters/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm chương thành công (204 No Content)."""
        chapter = ChapterFactory()
        grant(user, ChapterPermission.DELETE)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{chapter.pk}")
        assert res.status_code == 204

        chapter.refresh_from_db()
        assert chapter.deleted_at is not None
        assert Chapter.objects.alive().filter(pk=chapter.pk).exists() is False

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        chapter = ChapterFactory()
        res = client.delete(f"{BASE_URL}/{chapter.pk}")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.chapter.delete bị 403."""
        chapter = ChapterFactory()
        api = login(user)
        res = api.delete(f"{BASE_URL}/{chapter.pk}")
        self.assert_forbidden(res)
