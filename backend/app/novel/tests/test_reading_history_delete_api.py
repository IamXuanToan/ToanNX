"""Kiểm thử endpoint xóa 1 mục lịch sử đọc: DELETE /api/v1/novel/reading-history/{id}."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.reading_history import ReadingHistory
from app.novel.tests.factories.chapter_factory import ChapterFactory
from app.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/reading-history"


class TestReadingHistoryDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/reading-history/{id}."""

    def test_delete_success(self, user: Any, login: Any) -> None:
        """Xóa 1 mục lịch sử đọc của mình thành công."""
        novel = NovelFactory()
        chapter = ChapterFactory(novel=novel)
        history = ReadingHistory.objects.create(user=user, novel=novel, chapter=chapter)

        api = login(user)
        res = api.delete(f"{BASE_URL}/{history.pk}")
        data = self.assert_success(res, 200)
        assert data["deleted"] is True

        history.refresh_from_db()
        assert history.deleted_at is not None

    def test_delete_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xóa lịch sử đọc của người khác (trả về 404 NOT_FOUND)."""
        other_user = UserFactory()
        novel = NovelFactory()
        chapter = ChapterFactory(novel=novel)
        history = ReadingHistory.objects.create(user=other_user, novel=novel, chapter=chapter)

        api = login(user)
        res = api.delete(f"{BASE_URL}/{history.pk}")
        self.assert_error(res, 404, "NOT_FOUND")
        assert ReadingHistory.objects.filter(pk=history.pk).exists() is True

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)
