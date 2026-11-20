"""Kiểm thử endpoint xóa tiểu thuyết: DELETE /api/v1/novel/novels/{id}."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.novel.models.novel import Novel
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.tests.factories.novel_factory import NovelFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/novel/novels"


class TestNovelDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/novel/novels/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm tiểu thuyết thành công (204 No Content), DB lưu deleted_at."""
        novel = NovelFactory(owner=user)
        grant(user, NovelPermission.DELETE)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{novel.pk}")
        assert res.status_code == 204

        novel.refresh_from_db()
        assert novel.deleted_at is not None
        assert Novel.objects.alive().filter(pk=novel.pk).exists() is False

    def test_delete_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Người dùng khác xóa truyện của người khác nhận 404."""
        other_user = UserFactory()
        novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.DELETE)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{novel.pk}")
        self.assert_error(res, 404, "NOT_FOUND")
        novel.refresh_from_db()
        assert novel.deleted_at is None

    def test_delete_manage_all_success(self, user: Any, login: Any) -> None:
        """Người dùng có quyền MANAGE_ALL xóa được truyện của người khác."""
        other_user = UserFactory()
        novel = NovelFactory(owner=other_user)

        grant(user, NovelPermission.DELETE, NovelPermission.MANAGE_ALL)
        api = login(user)

        res = api.delete(f"{BASE_URL}/{novel.pk}")
        assert res.status_code == 204
        novel.refresh_from_db()
        assert novel.deleted_at is not None

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        novel = NovelFactory()
        res = client.delete(f"{BASE_URL}/{novel.pk}")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền novel.novel.delete bị 403."""
        novel = NovelFactory(owner=user)
        api = login(user)
        res = api.delete(f"{BASE_URL}/{novel.pk}")
        self.assert_forbidden(res)
