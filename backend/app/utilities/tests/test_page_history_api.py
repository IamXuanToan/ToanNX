"""Kiểm thử endpoint lịch sử thay đổi trang: GET /api/v1/utilities/pages/{id}/history."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/pages"


class TestPageHistoryApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/pages/{id}/history."""

    def test_history_success(self, user: Any, login: Any) -> None:
        """Lấy lịch sử thay đổi trang thành công."""
        grant(user, P.CREATE, P.UPDATE, P.READ)
        path = get_seeded_path("p")
        api = login(user)

        # 1. Tạo qua API để sinh journal entry CREATE
        created = self.assert_success(
            api.post(
                BASE_URL,
                {"path_id": str(path.pk), "title": "Trang Ban Đầu", "slug": "history-page"},
                format="json",
            ),
            201,
        )

        # 2. Sửa qua API để sinh journal entry UPDATE
        self.assert_success(
            api.patch(f"{BASE_URL}/{created['id']}", {"title": "Trang Đổi Tên"}, format="json"), 200
        )

        # 3. Lấy lịch sử
        res = api.get(f"{BASE_URL}/{created['id']}/history")
        history = self.assert_success(res, 200)

        assert len(history) == 2
        assert [entry["action"] for entry in history] == ["UPDATE", "CREATE"]

    def test_history_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xem lịch sử trang của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.READ)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Khác", slug="other-hist")

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_page.pk}/history")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_history_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000/history")
        self.assert_unauthorized(res)

    def test_history_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page.read bị 403."""
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang", slug="p")
        api = login(user)
        res = api.get(f"{BASE_URL}/{page.pk}/history")
        self.assert_forbidden(res)
