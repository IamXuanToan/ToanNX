"""Kiểm thử endpoint chi tiết tác giả: GET /api/v1/novel/authors/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.author_permission import AuthorPermission
from app.novel.tests.factories.author_factory import AuthorFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/authors"


class TestAuthorDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/authors/{id}."""

    def test_detail_success_full_data(self, user: Any, login: Any) -> None:
        """Lấy chi tiết tác giả thành công."""
        author = AuthorFactory(name="Mặc Hương Đồng Khứu", bio="Tác giả nổi tiếng...")
        grant(user, AuthorPermission.READ)
        api = login(user)

        res = api.get(f"{BASE_URL}/{author.pk}")
        data = self.assert_success(res, 200)

        assert data["id"] == str(author.pk)
        assert data["name"] == "Mặc Hương Đồng Khứu"
        assert data["bio"] == "Tác giả nổi tiếng..."

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        author = AuthorFactory()
        res = client.get(f"{BASE_URL}/{author.pk}")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.author.read bị 403."""
        author = AuthorFactory()
        api = login(user)
        res = api.get(f"{BASE_URL}/{author.pk}")
        self.assert_forbidden(res)
