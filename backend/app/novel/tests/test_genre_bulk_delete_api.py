"""Kiểm thử endpoint xóa lô thể loại: POST /api/v1/novel/genres/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.genre_permission import GenrePermission
from app.novel.tests.factories.genre_factory import GenreFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/genres/bulk-delete"


class TestGenreBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/genres/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa lô danh sách thể loại thành công."""
        genres = GenreFactory.create_batch(3)
        grant(user, GenrePermission.DELETE)
        api = login(user)

        payload = {"ids": [str(g.pk) for g in genres]}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 3
        for g in genres:
            g.refresh_from_db()
            assert g.deleted_at is not None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.genre.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
