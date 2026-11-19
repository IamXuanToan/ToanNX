"""Kiểm thử endpoint ghi nhận lịch sử đọc: POST /api/v1/novel/reading-history."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.novel.models.reading_history import ReadingHistory
from app.modules.novel.tests.factories.chapter_factory import ChapterFactory
from app.modules.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/reading-history"


class TestReadingHistoryCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/reading-history."""

    def test_create_record_history_success(self, user: Any, login: Any) -> None:
        """Ghi nhận lịch sử đọc thành công."""
        novel = NovelFactory()
        chapter = ChapterFactory(novel=novel, chapter_number=2)

        api = login(user)
        payload = {"novel_id": str(novel.pk), "chapter_id": str(chapter.pk)}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["novel_id"] == str(novel.pk)
        assert data["chapter_id"] == str(chapter.pk)

        history = ReadingHistory.objects.get(user=user, novel=novel)
        assert history.chapter_id == chapter.pk

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu novel_id hoặc chapter_id."""
        api = login(user)
        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "novel_id" in error["details"]
        assert "chapter_id" in error["details"]

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {}, format="json")
        self.assert_unauthorized(res)
