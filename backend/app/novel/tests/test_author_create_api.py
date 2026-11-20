"""Kiểm thử endpoint tạo tác giả: POST /api/v1/novel/authors."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.author_permission import AuthorPermission

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/authors"


class TestAuthorCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/authors."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo tác giả thành công với đầy đủ các trường (name, slug, bio)."""
        grant(user, AuthorPermission.CREATE)
        api = login(user)

        payload = {
            "name": "Ngã Cật Tây Hồng Thị",
            "slug": "nga-cat-tay-hong-thi",
            "bio": "Đại thần văn học mạng Trung Quốc...",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Ngã Cật Tây Hồng Thị"
        assert data["slug"] == "nga-cat-tay-hong-thi"
        assert data["bio"] == "Đại thần văn học mạng Trung Quốc..."

    def test_create_success_min_data(self, user: Any, login: Any) -> None:
        """Tạo tác giả thành công với dữ liệu tối thiểu (chỉ trường bắt buộc)."""
        grant(user, AuthorPermission.CREATE)
        api = login(user)

        payload = {"name": "Tác Giả Tối Thiểu", "slug": "tac-gia-toi-thieu"}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Tác Giả Tối Thiểu"
        assert data["slug"] == "tac-gia-toi-thieu"
        assert data["bio"] == ""

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu trường bắt buộc."""
        grant(user, AuthorPermission.CREATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "name" in error["details"]

    def test_create_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Validate lỗi khi trùng slug tác giả."""
        grant(user, AuthorPermission.CREATE)
        api = login(user)

        api.post(URL, {"name": "Tác Giả 1", "slug": "trung-slug-tg"}, format="json")
        res = api.post(URL, {"name": "Tác Giả 2", "slug": "trung-slug-tg"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"name": "Khách", "slug": "khach"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.author.create bị 403."""
        api = login(user)
        res = api.post(URL, {"name": "Thiếu", "slug": "thieu"}, format="json")
        self.assert_forbidden(res)
