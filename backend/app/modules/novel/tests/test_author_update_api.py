"""Kiểm thử endpoint cập nhật tác giả: PATCH /api/v1/novel/authors/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.author_permission import AuthorPermission
from app.modules.novel.tests.factories.author_factory import AuthorFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/authors"


class TestAuthorUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/novel/authors/{id}."""

    def test_update_success_full_data(self, user: Any, login: Any) -> None:
        """Cập nhật toàn bộ thông tin tác giả thành công."""
        author = AuthorFactory(name="Cũ", bio="Cũ")
        grant(user, AuthorPermission.UPDATE)
        api = login(user)

        payload = {"name": "Tên Mới", "slug": "slug-moi-tg", "bio": "Bio mới..."}
        res = api.patch(f"{BASE_URL}/{author.pk}", payload, format="json")
        data = self.assert_success(res, 200)

        assert data["name"] == "Tên Mới"
        assert data["slug"] == "slug-moi-tg"
        assert data["bio"] == "Bio mới..."

    def test_update_validation_duplicate_slug(self, user: Any, login: Any) -> None:
        """Báo lỗi khi cập nhật trùng slug của tác giả khác."""
        AuthorFactory(slug="slug-ton-tai")
        author = AuthorFactory(slug="slug-cua-toi")

        grant(user, AuthorPermission.UPDATE)
        api = login(user)

        res = api.patch(f"{BASE_URL}/{author.pk}", {"slug": "slug-ton-tai"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        author = AuthorFactory()
        res = client.patch(f"{BASE_URL}/{author.pk}", {"name": "Test"}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.author.update bị 403."""
        author = AuthorFactory()
        api = login(user)
        res = api.patch(f"{BASE_URL}/{author.pk}", {"name": "Test"}, format="json")
        self.assert_forbidden(res)
