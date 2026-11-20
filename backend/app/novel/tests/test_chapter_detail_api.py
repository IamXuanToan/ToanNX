"""Kiểm thử endpoint chi tiết chương: GET /api/v1/novel/chapters/{id}."""

import uuid
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.chapter_permission import ChapterPermission
from app.novel.tests.factories.chapter_factory import ChapterFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/chapters"


class TestChapterDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/chapters/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết chương thành công với đầy đủ dữ liệu."""
        chapter = ChapterFactory(chapter_number=1, title="Chương 1", content="Nội dung chi tiết...")
        grant(user, ChapterPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{chapter.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(chapter.pk)
        assert data["chapter_number"] == 1
        assert data["title"] == "Chương 1"
        assert data["content"] == "Nội dung chi tiết..."
        assert data["novel_id"] == str(chapter.novel_id)

    def test_detail_not_found(self, user: Any, login: Any) -> None:
        """Truy vấn id không tồn tại trả về 404 NOT_FOUND."""
        grant(user, ChapterPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{uuid.uuid4()}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        chapter = ChapterFactory()
        res = client.get(f"{BASE_URL}/{chapter.pk}")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.chapter.read bị 403."""
        chapter = ChapterFactory()
        api = login(user)
        res = api.get(f"{BASE_URL}/{chapter.pk}")
        self.assert_forbidden(res)
