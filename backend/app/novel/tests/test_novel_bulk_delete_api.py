"""Kiểm thử endpoint xóa lô tiểu thuyết: POST /api/v1/novel/novels/bulk-delete."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/novels/bulk-delete"


class TestNovelBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/novel/novels/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa lô danh sách tiểu thuyết thành công."""
        novels = NovelFactory.create_batch(3, owner=user)
        grant(user, NovelPermission.DELETE)
        api = login(user)

        payload = {"ids": [str(n.pk) for n in novels]}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 3
        for n in novels:
            n.refresh_from_db()
            assert n.deleted_at is not None

    def test_bulk_delete_owner_isolation(self, user: Any, login: Any) -> None:
        """Xóa lô chứa bản ghi của người khác sẽ bị từ chối 404 (bảo toàn toàn vẹn)."""
        my_novel = NovelFactory(owner=user)
        other_user = UserFactory()
        other_novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.DELETE)
        api = login(user)

        payload = {"ids": [str(my_novel.pk), str(other_novel.pk)]}
        res = api.post(URL, payload, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        # Rollback: Không bản ghi nào bị xóa
        my_novel.refresh_from_db()
        other_novel.refresh_from_db()
        assert my_novel.deleted_at is None
        assert other_novel.deleted_at is None

    def test_bulk_delete_manage_all_success(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL xóa lô được cả bản ghi của người khác."""
        my_novel = NovelFactory(owner=user)
        other_user = UserFactory()
        other_novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.DELETE, NovelPermission.MANAGE_ALL)
        api = login(user)

        payload = {"ids": [str(my_novel.pk), str(other_novel.pk)]}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.novel.delete bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
