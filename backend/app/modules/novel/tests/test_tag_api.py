"""Integration tests cho API Thẻ / Hashtag (/api/v1/novel/tags)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.tag import Tag
from app.modules.novel.permissions.tag_permission import TagPermission

pytestmark = pytest.mark.django_db
BASE_TAGS = "/api/v1/novel/tags"


class TestTagApi(BaseApiTestCase):
    """Kiểm thử API quản trị thẻ / hashtag tiểu thuyết."""

    def test_tag_crud_and_auto_slug(self, user: Any, login: Any) -> None:
        """Kiểm tra CRUD thẻ tiểu thuyết với slug tự động sinh từ tên và xóa mềm."""
        grant(
            user,
            TagPermission.CREATE,
            TagPermission.READ,
            TagPermission.UPDATE,
            TagPermission.DELETE,
        )
        api = login(user)

        # 1. Tạo thẻ
        created = self.assert_success(
            api.post(BASE_TAGS, {"name": "Xuyên Không"}, format="json"),
            201,
        )
        tag_id = created["id"]
        assert created["name"] == "Xuyên Không"
        assert created["slug"] == "xuyen-khong"

        # 2. Danh sách thẻ
        listed, pag = self.assert_paginated(api.get(BASE_TAGS, {"search": "Xuyên", "page": 1}))
        assert pag["total"] == 1
        assert listed[0]["id"] == tag_id

        # 3. Chi tiết thẻ
        detail = self.assert_success(api.get(f"{BASE_TAGS}/{tag_id}"))
        assert detail["id"] == tag_id

        # 4. Cập nhật thẻ
        updated = self.assert_success(
            api.patch(f"{BASE_TAGS}/{tag_id}", {"name": "Trọng Sinh"}, format="json")
        )
        assert updated["name"] == "Trọng Sinh"

        # 5. Xóa mềm thẻ
        del_res = api.delete(f"{BASE_TAGS}/{tag_id}")
        assert del_res.status_code == 204
        self.assert_error(api.get(f"{BASE_TAGS}/{tag_id}"), 404, "NOT_FOUND")
        assert Tag.objects.alive().filter(pk=tag_id).exists() is False

    def test_tag_permissions(self, client: Any, user: Any, login: Any) -> None:
        """Kiểm tra 401 khi chưa đăng nhập và 403 khi thiếu quyền TagPermission."""
        self.assert_unauthorized(client.get(BASE_TAGS))
        self.assert_unauthorized(client.post(BASE_TAGS, {"name": "Test"}, format="json"))

        api = login(user)
        self.assert_forbidden(api.get(BASE_TAGS))
        self.assert_forbidden(api.post(BASE_TAGS, {"name": "Test"}, format="json"))
