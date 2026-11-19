"""Integration tests cho API Giao diện độc giả (/api/v1/novel/client/...)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.reading_history import ReadingHistory
from app.modules.novel.permissions.chapter_permission import ChapterPermission
from app.modules.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
BASE_NOVELS = "/api/v1/novel/novels"
BASE_CHAPTERS = "/api/v1/novel/chapters"
BASE_FAVORITES = "/api/v1/novel/favorites"


class TestNovelClientApi(BaseApiTestCase):
    """Kiểm thử API trải nghiệm đọc truyện của độc giả."""

    def test_client_reading_flow_and_auto_history(self, user: Any, login: Any) -> None:
        """Kiểm tra luồng đọc chương truyện: tự động ghi nhận lịch sử và điều hướng."""
        grant(user, NovelPermission.CREATE, ChapterPermission.CREATE)
        api = login(user)

        # 1. Tạo tiểu thuyết và 2 chương
        novel = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Đại Phụng Đả Canh Nhân", "slug": "dai-phung"}, format="json"),
            201,
        )
        novel_id = novel["id"]

        self.assert_success(
            api.post(
                BASE_CHAPTERS,
                {
                    "novel_id": novel_id,
                    "chapter_number": 1,
                    "title": "Chương 1",
                    "content": "Nội dung chương 1",
                    "is_published": True,
                },
                format="json",
            ),
            201,
        )
        self.assert_success(
            api.post(
                BASE_CHAPTERS,
                {
                    "novel_id": novel_id,
                    "chapter_number": 2,
                    "title": "Chương 2",
                    "content": "Nội dung chương 2",
                    "is_published": True,
                },
                format="json",
            ),
            201,
        )

        # 2. Đọc chương 1 qua API client
        ch1_client = self.assert_success(api.get("/api/v1/novel/client/chapters/dai-phung/1"))
        assert ch1_client["chapter_number"] == 1
        assert ch1_client["next_chapter_number"] == 2
        assert ch1_client["prev_chapter_number"] is None

        # Tự động ghi nhận lịch sử đọc trong database
        assert ReadingHistory.objects.filter(user=user, chapter__chapter_number=1).exists() is True

        # 3. Yêu thích truyện
        self.assert_success(api.post(f"{BASE_FAVORITES}/toggle", {"novel_id": novel_id}, format="json"))

        # 4. Kiểm tra chi tiết truyện phản ánh chính xác trạng thái đọc và yêu thích
        novel_detail = self.assert_success(api.get("/api/v1/novel/client/novels/dai-phung"))
        assert novel_detail["is_favorite"] is True
        assert 1 in novel_detail["read_chapter_numbers"]
        assert novel_detail["latest_read_chapter_number"] == 1
        assert novel_detail["chapters_count"] == 2

    def test_client_api_unauthorized(self, client: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập vào các endpoint client đọc truyện."""
        self.assert_unauthorized(client.get("/api/v1/novel/client/novels/dai-phung"))
        self.assert_unauthorized(client.get("/api/v1/novel/client/chapters/dai-phung/1"))
