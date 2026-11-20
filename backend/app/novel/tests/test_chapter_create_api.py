"""Kiểm thử endpoint tạo chương: POST /api/v1/novel/chapters."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.chapter import Chapter
from app.novel.permissions.chapter_permission import ChapterPermission
from app.novel.tests.factories.novel_factory import NovelFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/chapters"


class TestChapterCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/chapters."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo chương thành công với đầy đủ các trường."""
        novel = NovelFactory(owner=user)
        grant(user, ChapterPermission.CREATE)
        api = login(user)

        payload = {
            "novel_id": str(novel.pk),
            "chapter_number": 1,
            "title": "Chương 1: Khởi đầu",
            "content": "Nội dung chương 1 rất dài...",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["chapter_number"] == 1
        assert data["title"] == "Chương 1: Khởi đầu"
        assert data["content"] == "Nội dung chương 1 rất dài..."
        assert data["novel_id"] == str(novel.pk)

        chapter = Chapter.objects.get(pk=data["id"])
        assert chapter.novel_id == novel.pk

    def test_create_success_min_data(self, user: Any, login: Any) -> None:
        """Tạo chương với dữ liệu tối thiểu (chỉ trường bắt buộc)."""
        novel = NovelFactory(owner=user)
        grant(user, ChapterPermission.CREATE)
        api = login(user)

        payload = {
            "novel_id": str(novel.pk),
            "chapter_number": 2,
            "title": "Chương 2",
            "content": "Nội dung...",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)
        assert data["chapter_number"] == 2

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu trường bắt buộc."""
        grant(user, ChapterPermission.CREATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "novel_id" in error["details"]
        assert "chapter_number" in error["details"]
        assert "title" in error["details"]
        assert "content" in error["details"]

    def test_create_validation_duplicate_chapter_number(self, user: Any, login: Any) -> None:
        """Validate lỗi khi trùng số thứ tự chương trong cùng một bộ truyện."""
        novel = NovelFactory(owner=user)
        grant(user, ChapterPermission.CREATE)
        api = login(user)

        payload = {
            "novel_id": str(novel.pk),
            "chapter_number": 1,
            "title": "Chương 1",
            "content": "Nội dung...",
        }
        api.post(URL, payload, format="json")

        # Tạo lại cùng chapter_number = 1
        res = api.post(URL, payload, format="json")
        self.assert_error(res, 400, "CHAPTER_NUMBER_EXISTS")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.chapter.create bị 403."""
        api = login(user)
        res = api.post(URL, {}, format="json")
        self.assert_forbidden(res)
