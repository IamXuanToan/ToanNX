"""Integration tests toàn diện cho API Tiểu thuyết (/api/v1/novel/novels)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.novel import Novel
from app.modules.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
BASE_NOVELS = "/api/v1/novel/novels"


class TestNovelApi(BaseApiTestCase):
    """Kiểm thử API quản trị tiểu thuyết."""

    def test_novel_crud_lifecycle(self, user: Any, login: Any) -> None:
        """Kiểm tra toàn bộ vòng đời CRUD của tiểu thuyết: tạo, xem, cập nhật, xóa mềm."""
        grant(
            user,
            NovelPermission.CREATE,
            NovelPermission.READ,
            NovelPermission.UPDATE,
            NovelPermission.DELETE,
        )
        api = login(user)

        # 1. Tạo tiểu thuyết
        payload = {
            "title": "Thiên Đạo Đồ Thư Quán",
            "slug": "thien-dao-do-thu-quan",
            "description": "Nội dung tóm tắt bộ truyện...",
            "status": "ONGOING",
        }
        created = self.assert_success(api.post(BASE_NOVELS, payload, format="json"), 201)
        novel_id = created["id"]
        assert created["title"] == "Thiên Đạo Đồ Thư Quán"
        assert created["slug"] == "thien-dao-do-thu-quan"

        # 2. Lấy danh sách tiểu thuyết có phân trang
        listed, pagination = self.assert_paginated(api.get(BASE_NOVELS, {"page": 1}))
        assert pagination["total"] == 1
        assert listed[0]["id"] == novel_id

        # 3. Lấy chi tiết tiểu thuyết
        detail = self.assert_success(api.get(f"{BASE_NOVELS}/{novel_id}"))
        assert detail["id"] == novel_id
        assert detail["status"] == "ONGOING"

        # 4. Cập nhật tiểu thuyết (cập nhật trạng thái và slug)
        updated = self.assert_success(
            api.patch(
                f"{BASE_NOVELS}/{novel_id}",
                {"status": "COMPLETED", "slug": "thien-dao-do-thu-quan-moi"},
                format="json",
            )
        )
        assert updated["status"] == "COMPLETED"
        assert updated["slug"] == "thien-dao-do-thu-quan-moi"

        # 5. Xóa mềm tiểu thuyết (204 No Content)
        del_res = api.delete(f"{BASE_NOVELS}/{novel_id}")
        assert del_res.status_code == 204
        self.assert_error(api.get(f"{BASE_NOVELS}/{novel_id}"), 404, "NOT_FOUND")

        # Bản ghi trong DB đã bị đánh dấu deleted_at
        novel_in_db = Novel.objects.get(pk=novel_id)
        assert novel_in_db.deleted_at is not None
        assert Novel.objects.alive().filter(pk=novel_id).exists() is False

    def test_novel_slug_duplicate_conflict(self, user: Any, login: Any) -> None:
        """Kiểm tra báo lỗi khi trùng slug tiểu thuyết."""
        grant(user, NovelPermission.CREATE, NovelPermission.UPDATE)
        api = login(user)

        self.assert_success(
            api.post(BASE_NOVELS, {"title": "Truyện A", "slug": "truyen-chuan"}, format="json"),
            201,
        )

        # Trùng slug khi tạo mới -> 400 NOVEL_SLUG_EXISTS
        self.assert_error(
            api.post(BASE_NOVELS, {"title": "Truyện B", "slug": "truyen-chuan"}, format="json"),
            400,
            "NOVEL_SLUG_EXISTS",
        )

    def test_novel_filter_search_and_ordering(self, user: Any, login: Any) -> None:
        """Kiểm tra tìm kiếm, lọc theo trạng thái và sắp xếp danh sách tiểu thuyết."""
        grant(user, NovelPermission.CREATE, NovelPermission.READ)
        api = login(user)

        self.assert_success(
            api.post(
                BASE_NOVELS,
                {"title": "Phàm Nhân Tu Tiên", "slug": "pham-nhan", "status": "COMPLETED"},
                format="json",
            ),
            201,
        )
        self.assert_success(
            api.post(
                BASE_NOVELS,
                {"title": "Nhất Niệm Vĩnh Hằng", "slug": "nhat-niem", "status": "ONGOING"},
                format="json",
            ),
            201,
        )

        # Lọc theo status=COMPLETED
        filtered, pag = self.assert_paginated(api.get(BASE_NOVELS, {"status": "COMPLETED", "page": 1}))
        assert pag["total"] == 1
        assert filtered[0]["slug"] == "pham-nhan"

        # Tìm kiếm theo từ khóa
        searched, pag = self.assert_paginated(api.get(BASE_NOVELS, {"search": "Nhất Niệm", "page": 1}))
        assert pag["total"] == 1
        assert searched[0]["slug"] == "nhat-niem"

    def test_novel_bulk_delete(self, user: Any, login: Any) -> None:
        """Kiểm tra xóa hàng loạt tiểu thuyết."""
        grant(user, NovelPermission.CREATE, NovelPermission.READ, NovelPermission.DELETE)
        api = login(user)

        n1 = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Truyện 1", "slug": "t1"}, format="json"), 201
        )
        n2 = self.assert_success(
            api.post(BASE_NOVELS, {"title": "Truyện 2", "slug": "t2"}, format="json"), 201
        )

        bulk_res = self.assert_success(
            api.post(f"{BASE_NOVELS}/bulk-delete", {"ids": [n1["id"], n2["id"]]}, format="json")
        )
        assert bulk_res["count"] == 2
        assert Novel.objects.alive().filter(pk__in=[n1["id"], n2["id"]]).count() == 0

    def test_novel_permissions(self, client: Any, user: Any, login: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập và 403 khi thiếu quyền."""
        # 401 Unauthorized
        self.assert_unauthorized(client.get(BASE_NOVELS))
        self.assert_unauthorized(client.post(BASE_NOVELS, {"title": "X", "slug": "x"}, format="json"))

        # 403 Forbidden khi user đăng nhập nhưng chưa cấp quyền
        api = login(user)
        self.assert_forbidden(api.get(BASE_NOVELS))
        self.assert_forbidden(api.post(BASE_NOVELS, {"title": "X", "slug": "x"}, format="json"))
