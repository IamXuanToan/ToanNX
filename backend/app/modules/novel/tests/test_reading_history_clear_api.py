"""Kiểm thử endpoint xóa toàn bộ lịch sử đọc: DELETE /api/v1/novel/reading-history."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.novel.models.reading_history import ReadingHistory
from app.modules.novel.tests.factories.chapter_factory import ChapterFactory
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/reading-history"


class TestReadingHistoryClearApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/reading-history."""

    def test_clear_all_success(self, user: Any, login: Any) -> None:
        """Xóa toàn bộ lịch sử đọc của người dùng hiện tại thành công."""
        n1 = NovelFactory()
        n2 = NovelFactory()
        c1 = ChapterFactory(novel=n1)
        c2 = ChapterFactory(novel=n2)
        ReadingHistory.objects.create(user=user, novel=n1, chapter=c1)
        ReadingHistory.objects.create(user=user, novel=n2, chapter=c2)

        other_user = UserFactory()
        other_history = ReadingHistory.objects.create(user=other_user, novel=n1, chapter=c1)

        api = login(user)
        res = api.delete(URL)
        data = self.assert_success(res, 200)
        assert data["deleted_count"] == 2

        assert ReadingHistory.objects.filter(user=user).exists() is False
        assert ReadingHistory.objects.filter(pk=other_history.pk).exists() is True

    def test_clear_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(URL)
        self.assert_unauthorized(res)
