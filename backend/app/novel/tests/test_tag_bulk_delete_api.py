"""Kiểm thử endpoint xóa lô thẻ: POST /api/v1/novel/tags/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.tag_permission import TagPermission
from app.novel.tests.factories.tag_factory import TagFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/tags/bulk-delete"


class TestTagBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/tags/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa lô danh sách thẻ thành công."""
        tags = TagFactory.create_batch(3)
        grant(user, TagPermission.DELETE)
        api = login(user)

        payload = {"ids": [str(t.pk) for t in tags]}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 3
        for t in tags:
            t.refresh_from_db()
            assert t.deleted_at is not None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.tag.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
