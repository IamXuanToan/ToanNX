"""Kiểm thử endpoint chi tiết truyện cho độc giả: GET /api/v1/novel/client/novels/{slug}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.novel.models.favorite import Favorite
from app.modules.novel.models.reading_history import ReadingHistory
from app.modules.novel.tests.factories.chapter_factory import ChapterFactory
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/client/novels"


class TestNovelClientDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/client/novels/{slug}."""

    def test_client_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Độc giả lấy chi tiết truyện thành công."""
        novel = NovelFactory(slug="pham-nhan-tu-tien", is_published=True)
        ChapterFactory(novel=novel, chapter_number=1, is_published=True)
        ChapterFactory(novel=novel, chapter_number=2, is_published=True)

        api = login(user)
        res = api.get(f"{BASE_URL}/{novel.slug}")
        data = self.assert_success(res, 200)

        assert data["slug"] == novel.slug
        assert data["title"] == novel.title
        assert data["is_favorite"] is False
        assert data["latest_read_chapter_number"] is None
        assert data["first_chapter_number"] == 1

    def test_client_detail_with_reading_history_and_favorite(self, user: Any, login: Any) -> None:
        """Độc giả lấy chi tiết truyện có trạng thái yêu thích và lịch sử đọc."""
        novel = NovelFactory(slug="truyen-yeu-thich", is_published=True)
        chapter = ChapterFactory(novel=novel, chapter_number=5, is_published=True)

        Favorite.objects.create(user=user, novel=novel)
        ReadingHistory.objects.create(user=user, novel=novel, chapter=chapter)

        api = login(user)
        res = api.get(f"{BASE_URL}/{novel.slug}")
        data = self.assert_success(res, 200)

        assert data["is_favorite"] is True
        assert data["latest_read_chapter_number"] == 5
        assert 5 in data["read_chapter_numbers"]

    def test_client_detail_not_found(self, user: Any, login: Any) -> None:
        """Slug không tồn tại trả về 404 NOT_FOUND."""
        api = login(user)
        res = api.get(f"{BASE_URL}/khong-ton-tai")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_client_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/truyen")
        self.assert_unauthorized(res)
