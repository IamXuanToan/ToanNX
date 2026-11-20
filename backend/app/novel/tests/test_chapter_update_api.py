"""Kiểm thử endpoint cập nhật chương: PATCH /api/v1/novel/chapters/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.chapter_permission import ChapterPermission
from app.novel.tests.factories.chapter_factory import ChapterFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/chapters"


class TestChapterUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/novel/chapters/{id}."""

    def test_update_success_full_data(self, user: Any, login: Any) -> None:
        """Cập nhật toàn bộ các trường của chương thành công."""
        chapter = ChapterFactory(chapter_number=1, title="Tiêu đề cũ", content="Nội dung cũ")
        grant(user, ChapterPermission.UPDATE)
        api = login(user)

        payload = {
            "title": "Tiêu đề mới toanh",
            "content": "Nội dung cập nhật mới...",
            "chapter_number": 1,
        }
        res = api.patch(f"{BASE_URL}/{chapter.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        assert data["title"] == "Tiêu đề mới toanh"
        assert data["content"] == "Nội dung cập nhật mới..."

        chapter.refresh_from_db()
        assert chapter.title == "Tiêu đề mới toanh"

    def test_update_success_partial_min_data(self, user: Any, login: Any) -> None:
        """Cập nhật từng phần (chỉ sửa title) thành công."""
        chapter = ChapterFactory(title="Cũ")
        grant(user, ChapterPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{chapter.pk}", {"title": "Mới"}, format="json")
        data = self.assert_success(res, 200)
        assert data["title"] == "Mới"

    def test_update_validation_duplicate_chapter_number(self, user: Any, login: Any) -> None:
        """Báo lỗi khi cập nhật trùng chapter_number của chương khác trong cùng truyện."""
        novel = ChapterFactory(chapter_number=1).novel
        ch2 = ChapterFactory(novel=novel, chapter_number=2)

        grant(user, ChapterPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{ch2.pk}", {"chapter_number": 1}, format="json")
        self.assert_error(res, 400, "CHAPTER_NUMBER_EXISTS")

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        chapter = ChapterFactory()
        res = client.patch(f"{BASE_URL}/{chapter.pk}", {"title": "Chưa Đăng Nhập"}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.chapter.update bị 403."""
        chapter = ChapterFactory()
        api = login(user)
        res = api.patch(f"{BASE_URL}/{chapter.pk}", {"title": "Thiếu Quyền"}, format="json")
        self.assert_forbidden(res)
