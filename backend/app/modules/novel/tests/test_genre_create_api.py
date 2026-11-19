"""Kiểm thử endpoint tạo thể loại: POST /api/v1/novel/genres."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.genre_permission import GenrePermission

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/genres"


class TestGenreCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/genres."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo thể loại thành công với đầy đủ các trường."""
        grant(user, GenrePermission.CREATE)
        api = login(user)

        payload = {
            "name": "Tiên Hiệp",
            "slug": "tien-hiep",
            "description": "Tu chân, vấn đạo trường sinh...",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Tiên Hiệp"
        assert data["slug"] == "tien-hiep"
        assert data["description"] == "Tu chân, vấn đạo trường sinh..."

    def test_create_success_min_data(self, user: Any, login: Any) -> None:
        """Tạo thể loại với dữ liệu tối thiểu (chỉ trường bắt buộc)."""
        grant(user, GenrePermission.CREATE)
        api = login(user)

        payload = {"name": "Kiếm Hiệp", "slug": "kiem-hiep"}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Kiếm Hiệp"
        assert data["slug"] == "kiem-hiep"
        assert data["description"] == ""

    def test_create_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Báo lỗi khi trùng slug thể loại."""
        grant(user, GenrePermission.CREATE)
        api = login(user)

        api.post(URL, {"name": "Thể loại 1", "slug": "trung-slug-tl"}, format="json")
        res = api.post(URL, {"name": "Thể loại 2", "slug": "trung-slug-tl"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"name": "Khách", "slug": "khach"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.genre.create bị 403."""
        api = login(user)
        res = api.post(URL, {"name": "Thiếu", "slug": "thieu"}, format="json")
        self.assert_forbidden(res)
