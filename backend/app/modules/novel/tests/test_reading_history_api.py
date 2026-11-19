"""Integration tests cho API Lịch sử đọc truyện (/api/v1/novel/reading-history)."""

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
BASE_HISTORY = "/api/v1/novel/reading-history"


class TestReadingHistoryApi(BaseApiTestCase):
    """Kiểm thử API quản lý lịch sử đọc truyện của độc giả."""

    def test_reading_history_crud_and_clear(self, user: Any, login: Any) -> None:
        """Kiểm tra ghi nhận lịch sử đọc, lấy danh sách, xóa từng mục và dọn sạch toàn bộ."""
        grant(user, NovelPermission.CREATE, ChapterPermission.CREATE)
        api = login(user)

        novel = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Linh Cảnh Hành Giả", "slug": "linh-canh"}, format="json"),
            201,
        )
        ch1 = self.assert_success(
            api.post(
                BASE_CHAPTERS,
                {"novel_id": novel["id"], "chapter_number": 1, "title": "Chương 1", "content": "Nội dung"},
                format="json",
            ),
            201,
        )
        ch2 = self.assert_success(
            api.post(
                BASE_CHAPTERS,
                {"novel_id": novel["id"], "chapter_number": 2, "title": "Chương 2", "content": "Nội dung"},
                format="json",
            ),
            201,
        )

        # 1. Ghi nhận lịch sử thủ công
        self.assert_success(
            api.post(BASE_HISTORY, {"novel_id": novel["id"], "chapter_id": ch1["id"]}, format="json"),
            200,
        )
        self.assert_success(
            api.post(BASE_HISTORY, {"novel_id": novel["id"], "chapter_id": ch2["id"]}, format="json"),
            200,
        )

        # 2. Lấy danh sách lịch sử đọc
        history_list = self.assert_success(api.get(BASE_HISTORY))
        assert len(history_list) == 2
        history_item_id = history_list[0]["id"]

        # 3. Xóa một mục lịch sử
        del_one = self.assert_success(api.delete(f"{BASE_HISTORY}/{history_item_id}"))
        assert del_one["deleted"] is True

        remaining = self.assert_success(api.get(BASE_HISTORY))
        assert len(remaining) == 1

        # 4. Dọn sạch toàn bộ lịch sử đọc
        clear_res = self.assert_success(api.delete(BASE_HISTORY))
        assert clear_res["deleted_count"] == 1

        empty_list = self.assert_success(api.get(BASE_HISTORY))
        assert len(empty_list) == 0
        assert ReadingHistory.objects.alive().filter(user=user).count() == 0

    def test_reading_history_unauthorized(self, client: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập vào các endpoint lịch sử đọc."""
        self.assert_unauthorized(client.get(BASE_HISTORY))
        self.assert_unauthorized(client.post(BASE_HISTORY, {}, format="json"))
        self.assert_unauthorized(client.delete(BASE_HISTORY))
