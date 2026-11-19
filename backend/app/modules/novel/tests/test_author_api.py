"""Integration tests cho API Tác giả (/api/v1/novel/authors)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.author import Author
from app.modules.novel.permissions.author_permission import AuthorPermission

pytestmark = pytest.mark.django_db
BASE_AUTHORS = "/api/v1/novel/authors"


class TestAuthorApi(BaseApiTestCase):
    """Kiểm thử API quản trị tác giả tiểu thuyết."""

    def test_author_crud_and_auto_slug(self, user: Any, login: Any) -> None:
        """Kiểm tra CRUD tác giả với slug tự động sinh từ tên và xóa mềm."""
        grant(
            user,
            AuthorPermission.CREATE,
            AuthorPermission.READ,
            AuthorPermission.UPDATE,
            AuthorPermission.DELETE,
        )
        api = login(user)

        # 1. Tạo tác giả không truyền slug (tự sinh slug từ name)
        created = self.assert_success(
            api.post(
                BASE_AUTHORS, {"name": "Ngã Cật Tây Hồng Thị", "bio": "Tác giả nổi tiếng"}, format="json"
            ),
            201,
        )
        author_id = created["id"]
        assert created["name"] == "Ngã Cật Tây Hồng Thị"
        assert created["slug"] == "nga-cat-tay-hong-thi"

        # 2. Danh sách tác giả kèm tìm kiếm
        listed, pag = self.assert_paginated(api.get(BASE_AUTHORS, {"search": "Tây Hồng Thị", "page": 1}))
        assert pag["total"] == 1
        assert listed[0]["id"] == author_id

        # 3. Chi tiết tác giả
        detail = self.assert_success(api.get(f"{BASE_AUTHORS}/{author_id}"))
        assert detail["id"] == author_id

        # 4. Cập nhật tiểu sử tác giả
        updated = self.assert_success(
            api.patch(f"{BASE_AUTHORS}/{author_id}", {"bio": "Tiểu sử cập nhật"}, format="json")
        )
        assert updated["bio"] == "Tiểu sử cập nhật"

        # 5. Xóa mềm tác giả
        del_res = api.delete(f"{BASE_AUTHORS}/{author_id}")
        assert del_res.status_code == 204
        self.assert_error(api.get(f"{BASE_AUTHORS}/{author_id}"), 404, "NOT_FOUND")
        assert Author.objects.alive().filter(pk=author_id).exists() is False

    def test_author_permissions(self, client: Any, user: Any, login: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập và 403 khi thiếu quyền AuthorPermission."""
        self.assert_unauthorized(client.get(BASE_AUTHORS))
        self.assert_unauthorized(client.post(BASE_AUTHORS, {"name": "Test"}, format="json"))

        api = login(user)
        self.assert_forbidden(api.get(BASE_AUTHORS))
        self.assert_forbidden(api.post(BASE_AUTHORS, {"name": "Test"}, format="json"))
