"""Integration tests cho API Nhập khẩu tiểu thuyết (/api/v1/novel/novels/import...)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.novel import Novel
from app.modules.novel.permissions.chapter_permission import ChapterPermission
from app.modules.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
BASE_TEMPLATE = "/api/v1/novel/novels/import-template"
BASE_IMPORT = "/api/v1/novel/novels/import"


class TestNovelImportApi(BaseApiTestCase):
    """Kiểm thử API tải template và nhập khẩu tiểu thuyết hàng loạt."""

    def test_import_template_structure(self, user: Any, login: Any) -> None:
        """Kiểm tra cấu trúc dữ liệu của file mẫu JSON dùng để import."""
        grant(user, NovelPermission.READ, NovelPermission.IMPORT)
        api = login(user)

        template = self.assert_success(api.get(BASE_TEMPLATE))
        assert "novel" in template
        assert "chapters" in template
        assert template["novel"]["title"] != ""
        assert len(template["chapters"]) > 0

    def test_import_novel_success(self, user: Any, login: Any) -> None:
        """Kiểm tra import thành công tiểu thuyết kèm danh sách chương."""
        grant(user, NovelPermission.CREATE, ChapterPermission.CREATE, NovelPermission.IMPORT)
        api = login(user)

        import_payload = {
            "novel": {
                "title": "Quỷ Bí Chi Chủ",
                "slug": "quy-bi-chi-chu",
                "author": "Ái Tiềm Thủy Đích Ô Tặc",
                "genres": ["Kỳ Ảo", "Trinh Thám"],
                "tags": ["Dị Giới", "Hơi Nước"],
                "description": "Thế giới steampunk huyền bí...",
            },
            "chapters": [
                {
                    "chapter_number": 1,
                    "title": "Chương 1: Khởi đầu hồng nguyệt",
                    "content": "Chu Minh Thụy tỉnh lại trong một căn phòng xa lạ...",
                },
                {
                    "chapter_number": 2,
                    "title": "Chương 2: Tình huống",
                    "content": "Hắn phát hiện bên thái dương có một vết thương...",
                },
            ],
        }

        import_result = self.assert_success(api.post(BASE_IMPORT, import_payload, format="json"), 201)
        assert import_result["novel_title"] == "Quỷ Bí Chi Chủ"
        assert import_result["chapters_count"] == 2

        novel_db = Novel.objects.get(slug="quy-bi-chi-chu")
        assert novel_db.chapters.filter(deleted_at__isnull=True).count() == 2
        assert novel_db.author is not None
        assert novel_db.author.name == "Ái Tiềm Thủy Đích Ô Tặc"
        assert novel_db.genres.count() == 2
        assert novel_db.tags.count() == 2

    def test_import_novel_validation_duplicate_chapters(self, user: Any, login: Any) -> None:
        """Kiểm tra báo lỗi khi dữ liệu import chứa các số chương bị trùng lặp."""
        grant(user, NovelPermission.CREATE, ChapterPermission.CREATE, NovelPermission.IMPORT)
        api = login(user)

        invalid_payload = {
            "novel": {"title": "Truyện Lỗi"},
            "chapters": [
                {"chapter_number": 1, "title": "C1", "content": "Nội dung 1"},
                {"chapter_number": 1, "title": "C2", "content": "Nội dung 2"},
            ],
        }
        self.assert_error(
            api.post(BASE_IMPORT, invalid_payload, format="json"),
            400,
            "CHAPTER_NUMBER_EXISTS",
        )

    def test_import_novel_permissions(self, client: Any, user: Any, login: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập và 403 khi thiếu quyền import."""
        self.assert_unauthorized(client.get(BASE_TEMPLATE))
        self.assert_unauthorized(client.post(BASE_IMPORT, {}, format="json"))

        api = login(user)
        self.assert_forbidden(api.get(BASE_TEMPLATE))
        self.assert_forbidden(api.post(BASE_IMPORT, {}, format="json"))
