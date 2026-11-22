"""Kiểm thử endpoint cập nhật hàng loạt chương: POST /api/v1/novel/chapters/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.chapter import Chapter
from app.novel.permissions.chapter_permission import ChapterPermission as P
from app.novel.tests.factories.chapter_factory import ChapterFactory
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/chapters/bulk-update"


def _make(owner: Any, n: int) -> Chapter:
    """Tạo chương thứ `n` (tài nguyên dùng chung thì bỏ qua `owner`)."""
    created = ChapterFactory(novel__owner=owner, is_published=True)
    return Chapter.objects.get(pk=created.pk)


class TestChapterBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/chapters/bulk-update."""

    def test_bulk_update_success(self, user: Any, login: Any) -> None:
        """Đổi cờ `is_published` của cả lô."""
        grant(user, P.UPDATE)
        items = [_make(user, 1), _make(user, 2)]
        api = login(user)

        payload = {"ids": [str(item.pk) for item in items], "is_published": False}
        data = self.assert_success(api.post(URL, payload, format="json"), 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.is_published is False

    def test_bulk_update_validation_errors(self, user: Any, login: Any) -> None:
        """Thiếu `ids` và cờ bị 400 VALIDATION_ERROR."""
        grant(user, P.UPDATE)
        api = login(user)

        error = self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"] and "is_published" in error["details"]

    def test_bulk_update_owner_isolation(self, user: Any, login: Any) -> None:
        """Lô có bản ghi của người khác → 404 và không bản ghi nào đổi."""
        grant(user, P.UPDATE)
        own = _make(user, 1)
        other = _make(UserFactory(), 2)
        api = login(user)

        payload = {"ids": [str(own.pk), str(other.pk)], "is_published": False}
        self.assert_error(api.post(URL, payload, format="json"), 404, "NOT_FOUND")
        own.refresh_from_db()
        assert own.is_published is True

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": [], "is_published": False}, format="json"))

    def test_bulk_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền sửa bị 403."""
        self.assert_forbidden(login(user).post(URL, {"ids": [], "is_published": False}, format="json"))
