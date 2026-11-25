"""Kiểm thử nội dung chương cho độc giả: GET /api/v1/novel/client/chapters/{novel_slug}/{chapter_number}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.reading_history import ReadingHistory
from app.novel.permissions.chapter_permission import ChapterPermission
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.tests.factories.chapter_factory import ChapterFactory
from app.novel.tests.factories.novel_factory import NovelFactory
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/client/chapters"


class TestNovelClientChapterApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/client/chapters/{novel_slug}/{chapter_number}."""

    def test_client_chapter_success(self, user: Any, login: Any) -> None:
        """Độc giả lấy nội dung chương thành công."""
        novel = NovelFactory(slug="truyen-doc", is_published=True)
        chapter = ChapterFactory(
            novel=novel, chapter_number=1, title="Chương 1", content="Nội dung chương 1", is_published=True
        )

        api = login(user)
        res = api.get(f"{BASE_URL}/{novel.slug}/{chapter.chapter_number}")
        data = self.assert_success(res, 200)

        assert data["title"] == "Chương 1"
        assert data["content"] == "Nội dung chương 1"
        assert data["chapter_number"] == 1
        assert data["novel_slug"] == novel.slug

    def test_client_chapter_navigation_links(self, user: Any, login: Any) -> None:
        """Kiểm tra liên kết chương trước/sau (prev_chapter_number, next_chapter_number)."""
        novel = NovelFactory(slug="truyen-nav", is_published=True)
        ChapterFactory(novel=novel, chapter_number=1, is_published=True)
        ch2 = ChapterFactory(novel=novel, chapter_number=2, is_published=True)
        ChapterFactory(novel=novel, chapter_number=3, is_published=True)

        api = login(user)
        res = api.get(f"{BASE_URL}/{novel.slug}/{ch2.chapter_number}")
        data = self.assert_success(res, 200)

        assert data["prev_chapter_number"] == 1
        assert data["next_chapter_number"] == 3

    def test_client_chapter_auto_records_history(self, user: Any, login: Any) -> None:
        """Đọc chương tự động ghi nhận/cập nhật lịch sử đọc của người dùng."""
        novel = NovelFactory(slug="truyen-auto-history", is_published=True)
        chapter = ChapterFactory(novel=novel, chapter_number=10, is_published=True)

        api = login(user)
        api.get(f"{BASE_URL}/{novel.slug}/{chapter.chapter_number}")

        history = ReadingHistory.objects.get(user=user, novel=novel)
        assert history.chapter_id == chapter.pk

    def test_client_chapter_not_found(self, user: Any, login: Any) -> None:
        """Chương không tồn tại trả về 404 NOT_FOUND."""
        novel = NovelFactory(slug="truyen-not-found")
        api = login(user)
        res = api.get(f"{BASE_URL}/{novel.slug}/999")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_client_chapter_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/truyen/1")
        self.assert_unauthorized(res)

    def test_client_chapter_staff_without_permission_cannot_read_unpublished(self, login: Any) -> None:
        """Tài khoản chỉ gắn is_staff nhưng thiếu novel.chapter.read không đọc được chương nháp."""
        staff = UserFactory(is_staff=True)
        novel = NovelFactory(slug="truyen-nhap-ch-staff", is_published=True)
        chapter = ChapterFactory(novel=novel, chapter_number=1, is_published=False)
        res = login(staff).get(f"{BASE_URL}/{novel.slug}/{chapter.chapter_number}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_client_chapter_owner_with_read_permission_can_read_unpublished(
        self, user: Any, login: Any
    ) -> None:
        """Chủ sở hữu có novel.chapter.read (và novel.novel.read nếu truyện nháp) xem được chương nháp."""
        grant(user, NovelPermission.READ, ChapterPermission.READ)
        novel = NovelFactory(slug="truyen-nhap-ch-owner", owner=user, is_published=False)
        chapter = ChapterFactory(novel=novel, chapter_number=1, is_published=False)
        res = login(user).get(f"{BASE_URL}/{novel.slug}/{chapter.chapter_number}")
        data = self.assert_success(res, 200)
        assert data["chapter_number"] == 1
