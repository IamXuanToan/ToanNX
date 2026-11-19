"""Kiểm thử endpoint xóa tác giả: DELETE /api/v1/novel/authors/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.models.author import Author
from app.modules.novel.permissions.author_permission import AuthorPermission
from app.modules.novel.tests.factories.author_factory import AuthorFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/authors"


class TestAuthorDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/authors/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm tác giả thành công (204 No Content)."""
        author = AuthorFactory()
        grant(user, AuthorPermission.DELETE)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{author.pk}")
        assert res.status_code == 204

        author.refresh_from_db()
        assert author.deleted_at is not None
        assert Author.objects.alive().filter(pk=author.pk).exists() is False

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        author = AuthorFactory()
        res = client.delete(f"{BASE_URL}/{author.pk}")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.author.delete bị 403."""
        author = AuthorFactory()
        api = login(user)
        res = api.delete(f"{BASE_URL}/{author.pk}")
        self.assert_forbidden(res)
