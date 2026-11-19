"""Kiểm thử endpoint danh sách lịch sử đọc: GET /api/v1/novel/reading-history."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.novel.models.reading_history import ReadingHistory
from app.modules.novel.tests.factories.chapter_factory import ChapterFactory
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/reading-history"


class TestReadingHistoryListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/reading-history."""

    def test_list_success(self, user: Any, login: Any) -> None:
        """Lấy danh sách lịch sử đọc của người dùng thành công."""
        novel = NovelFactory()
        chapter = ChapterFactory(novel=novel, chapter_number=3)
        ReadingHistory.objects.create(user=user, novel=novel, chapter=chapter)

        api = login(user)
        res = api.get(URL)
        data = self.assert_success(res, 200)

        assert len(data) == 1
        assert data[0]["novel_id"] == str(novel.pk)
        assert data[0]["chapter_number"] == 3

    def test_list_owner_isolation(self, user: Any, login: Any) -> None:
        """Người dùng chỉ thấy lịch sử đọc của chính mình, không thấy của người khác."""
        other_user = UserFactory()
        novel = NovelFactory()
        chapter = ChapterFactory(novel=novel)
        ReadingHistory.objects.create(user=other_user, novel=novel, chapter=chapter)

        api = login(user)
        res = api.get(URL)
        data = self.assert_success(res, 200)
        assert len(data) == 0

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)
