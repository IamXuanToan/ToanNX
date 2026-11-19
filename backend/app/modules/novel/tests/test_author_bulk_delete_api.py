"""Kiểm thử endpoint xóa lô tác giả: POST /api/v1/novel/authors/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.author_permission import AuthorPermission
from app.modules.novel.tests.factories.author_factory import AuthorFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/authors/bulk-delete"


class TestAuthorBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/authors/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa lô danh sách tác giả thành công."""
        authors = AuthorFactory.create_batch(3)
        grant(user, AuthorPermission.DELETE)
        api = login(user)

        payload = {"ids": [str(a.pk) for a in authors]}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 3
        for a in authors:
            a.refresh_from_db()
            assert a.deleted_at is not None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.author.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
