"""Kiểm thử endpoint xóa lô chương: POST /api/v1/novel/chapters/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.models.chapter import Chapter
from app.novel.permissions.chapter_permission import ChapterPermission as P
from app.novel.tests.factories.chapter_factory import ChapterFactory
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/chapters/bulk-delete"


def _make(owner: Any, n: int) -> Chapter:
    """Tạo chương thứ `n` (tài nguyên dùng chung thì bỏ qua `owner`)."""
    created = ChapterFactory(novel__owner=owner, is_published=True)
    return Chapter.objects.get(pk=created.pk)


class TestChapterBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/chapters/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm cả lô thành công, trả số bản ghi đã xử lý."""
        grant(user, P.DELETE)
        items = [_make(user, 1), _make(user, 2)]
        api = login(user)

        res = api.post(URL, {"ids": [str(item.pk) for item in items]}, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.deleted_at is not None

    def test_bulk_delete_validation_missing_ids(self, user: Any, login: Any) -> None:
        """Thiếu `ids` bị 400 VALIDATION_ERROR."""
        grant(user, P.DELETE)
        api = login(user)

        error = self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_owner_isolation(self, user: Any, login: Any) -> None:
        """Lô có bản ghi của người khác → 404 và không bản ghi nào bị xóa."""
        grant(user, P.DELETE)
        own = _make(user, 1)
        other = _make(UserFactory(), 2)
        api = login(user)

        res = api.post(URL, {"ids": [str(own.pk), str(other.pk)]}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")
        own.refresh_from_db()
        assert own.deleted_at is None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": []}, format="json"))

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền xóa bị 403."""
        self.assert_forbidden(login(user).post(URL, {"ids": []}, format="json"))
