"""Kiểm thử endpoint danh mục người dùng trong quản trị phiên: GET /api/v1/auth/admin-sessions/users."""

from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.session_permission import SessionPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/admin-sessions/users"


class TestAdminSessionUserChoicesApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/auth/admin-sessions/users."""

    def test_user_choices_follow_session_permission(
        self, client: Any, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Quyền xem phiên đủ để lấy danh mục người dùng, không cấp ngầm quyền đọc tài khoản."""
        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(staff).get(URL))

        grant(user, P.SESSION_READ)
        self.assert_success(login(user).get(URL))  # theo quyền IAM, không cần staff

        grant(staff, P.SESSION_READ)
        api = login(staff)
        self.assert_forbidden(api.get("/api/v1/account/users"))

        items, meta = self.assert_paginated(api.get(URL, {"page": 1}))
        assert meta["total"] == 2
        assert {item["id"] for item in items} == {str(user.pk), str(staff.pk)}
        assert str(superuser.pk) not in {item["id"] for item in items}
        assert set(items[0]) == {"id", "email", "username", "first_name", "last_name"}

        first, page = self.assert_paginated(api.get(URL, {"page_size": 1}))
        second, _ = self.assert_paginated(api.get(URL, {"page_size": 1, "page": 2}))
        assert page["total_pages"] == 2
        assert first[0]["id"] != second[0]["id"]

        AuthSession.objects.filter(user=user).update(deleted_at=timezone.now())
        items, meta = self.assert_paginated(api.get(URL, {"page": 1}))
        assert meta["total"] == 1 and items[0]["id"] == str(staff.pk)

    def test_user_choices_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_user_choices_forbidden(self, user: Any, login: Any) -> None:
        """Người dùng thiếu quyền auth.session.read bị 403."""
        res = login(user).get(URL)
        self.assert_forbidden(res)
