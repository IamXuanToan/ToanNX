"""Kiểm thử endpoint lịch sử thay đổi short link: GET /api/v1/utilities/short-links/{id}/history."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.short_link_permission import ShortLinkPermission as P
from app.utilities.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/short-links"


class TestShortLinkHistoryApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/short-links/{id}/history."""

    def test_history_success(self, user: Any, login: Any) -> None:
        """Lấy lịch sử thay đổi của short link thành công."""
        grant(user, P.CREATE, P.UPDATE, P.READ)
        api = login(user)

        # 1. Tạo qua API để sinh journal entry CREATE
        created = self.assert_success(
            api.post(
                BASE_URL,
                {"name": "Link Ban Đầu", "slug": "history-link", "destination_url": "https://example.com"},
                format="json",
            ),
            201,
        )

        # 2. Sửa qua API để sinh journal entry UPDATE
        self.assert_success(
            api.patch(f"{BASE_URL}/{created['id']}", {"status": "INACTIVE"}, format="json"), 200
        )

        # 3. Lấy lịch sử
        res = api.get(f"{BASE_URL}/{created['id']}/history")
        history = self.assert_success(res, 200)

        assert len(history) == 2
        assert [entry["action"] for entry in history] == ["UPDATE", "CREATE"]
        assert history[0]["changes"] == {"status": ["ACTIVE", "INACTIVE"]}

    def test_history_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể xem lịch sử link của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.READ)
        other_user = UserFactory()
        other_link = ShortLinkFactory(owner=other_user)

        api = login(user)
        res = api.get(f"{BASE_URL}/{other_link.pk}/history")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_history_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000/history")
        self.assert_unauthorized(res)

    def test_history_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.short_link.read bị 403."""
        link = ShortLinkFactory(owner=user)
        api = login(user)
        res = api.get(f"{BASE_URL}/{link.pk}/history")
        self.assert_forbidden(res)
