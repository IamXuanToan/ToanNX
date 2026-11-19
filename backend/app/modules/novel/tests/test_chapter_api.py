"""Integration tests cho API Chương truyện (/api/v1/novel/chapters)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.chapter import Chapter
from app.modules.novel.permissions.chapter_permission import ChapterPermission
from app.modules.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
BASE_NOVELS = "/api/v1/novel/novels"
BASE_CHAPTERS = "/api/v1/novel/chapters"


class TestChapterApi(BaseApiTestCase):
    """Kiểm thử API quản trị chương truyện."""

    def test_chapter_crud_lifecycle(self, user: Any, login: Any) -> None:
        """Kiểm tra CRUD chương truyện, tính số từ tự động và xóa mềm."""
        grant(
            user,
            NovelPermission.CREATE,
            NovelPermission.READ,
            ChapterPermission.CREATE,
            ChapterPermission.READ,
            ChapterPermission.UPDATE,
            ChapterPermission.DELETE,
        )
        api = login(user)

        # Tạo truyện trước
        novel = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Mục Thần Ký", "slug": "muc-than-ky"}, format="json"),
            201,
        )
        novel_id = novel["id"]

        # 1. Tạo chương 1
        payload = {
            "novel_id": novel_id,
            "chapter_number": 1,
            "title": "Tàn Lão thôn thiếu niên",
            "content": "Tàn Lão thôn là một thôn trang đặc biệt nguy hiểm với nhiều bí ẩn...",
            "is_published": True,
        }
        ch1 = self.assert_success(api.post(BASE_CHAPTERS, payload, format="json"), 201)
        ch1_id = ch1["id"]
        assert ch1["chapter_number"] == 1
        assert ch1["word_count"] > 0
        assert ch1["title"] == "Tàn Lão thôn thiếu niên"

        # 2. Lấy danh sách chương theo novel_id
        listed, pagination = self.assert_paginated(api.get(BASE_CHAPTERS, {"novel_id": novel_id, "page": 1}))
        assert pagination["total"] == 1
        assert listed[0]["id"] == ch1_id

        # 3. Lấy chi tiết chương
        detail = self.assert_success(api.get(f"{BASE_CHAPTERS}/{ch1_id}"))
        assert detail["id"] == ch1_id
        assert detail["content"] == payload["content"]

        # 4. Cập nhật chương
        updated = self.assert_success(
            api.patch(f"{BASE_CHAPTERS}/{ch1_id}", {"title": "Thiếu niên xuất sơn"}, format="json")
        )
        assert updated["title"] == "Thiếu niên xuất sơn"

        # 5. Xóa mềm chương (204 No Content)
        del_res = api.delete(f"{BASE_CHAPTERS}/{ch1_id}")
        assert del_res.status_code == 204
        self.assert_error(api.get(f"{BASE_CHAPTERS}/{ch1_id}"), 404, "NOT_FOUND")
        assert Chapter.objects.alive().filter(pk=ch1_id).exists() is False

    def test_chapter_duplicate_number_conflict(self, user: Any, login: Any) -> None:
        """Kiểm tra báo lỗi khi trùng số chương trong cùng một tiểu thuyết."""
        grant(user, NovelPermission.CREATE, ChapterPermission.CREATE)
        api = login(user)

        novel = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Kiếm Lai", "slug": "kiem-lai"}, format="json"),
            201,
        )
        novel_id = novel["id"]

        chapter_payload = {
            "novel_id": novel_id,
            "chapter_number": 1,
            "title": "Chương 1",
            "content": "Nội dung chương 1",
        }
        self.assert_success(api.post(BASE_CHAPTERS, chapter_payload, format="json"), 201)

        # Trùng số chương -> 400 CHAPTER_NUMBER_EXISTS
        self.assert_error(
            api.post(BASE_CHAPTERS, chapter_payload, format="json"),
            400,
            "CHAPTER_NUMBER_EXISTS",
        )

    def test_chapter_permissions(self, client: Any, user: Any, login: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập và 403 khi thiếu quyền quản lý chương."""
        # 401 Unauthorized
        self.assert_unauthorized(client.get(BASE_CHAPTERS))
        self.assert_unauthorized(client.post(BASE_CHAPTERS, {"title": "Chương"}, format="json"))

        # 403 Forbidden khi thiếu quyền
        api = login(user)
        self.assert_forbidden(api.get(BASE_CHAPTERS))
        self.assert_forbidden(api.post(BASE_CHAPTERS, {"title": "Chương"}, format="json"))
