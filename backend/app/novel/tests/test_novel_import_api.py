"""Kiểm thử endpoint import tiểu thuyết: POST /api/v1/novel/novels/import."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.models.novel import Novel
from app.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/novels/import"


class TestNovelImportApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/novels/import."""

    def test_import_success_full_data(self, user: Any, login: Any) -> None:
        """Import thành công truyện và toàn bộ danh sách chương từ JSON."""
        grant(user, NovelPermission.IMPORT)
        api = login(user)

        payload = {
            "format_version": "1.0",
            "novel": {
                "title": "Import Siêu Cấp",
                "slug": "import-sieu-cap",
                "author": "Đại Thần Mẫu",
                "genres": ["Tiên Hiệp", "Tu Chân"],
                "tags": ["Hệ Thống"],
                "description": "Truyện import tự động...",
                "status": "ONGOING",
            },
            "chapters": [
                {
                    "chapter_number": 1,
                    "title": "Chương 1: Mở màn",
                    "content": "Nội dung chương 1 rất dài...",
                },
                {
                    "chapter_number": 2,
                    "title": "Chương 2: Thăng cấp",
                    "content": "Nội dung chương 2...",
                },
            ],
        }

        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["chapters_count"] == 2
        assert data["novel_slug"] == "import-sieu-cap"

        novel = Novel.objects.get(slug="import-sieu-cap")
        assert novel.chapters.count() == 2
        assert novel.owner_id == user.pk

    def test_import_validation_missing_novel(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu thông tin novel."""
        grant(user, NovelPermission.IMPORT)
        api = login(user)

        res = api.post(URL, {"chapters": []}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_import_validation_missing_chapters(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu danh sách chapters."""
        grant(user, NovelPermission.IMPORT)
        api = login(user)

        res = api.post(URL, {"novel": {"title": "Truyện Không Chương"}}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_import_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {}, format="json")
        self.assert_unauthorized(res)

    def test_import_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.novel.import bị 403."""
        api = login(user)
        res = api.post(URL, {}, format="json")
        self.assert_forbidden(res)
