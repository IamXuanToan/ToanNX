"""Kiểm thử endpoint danh sách phiên quản trị: GET /api/v1/system/auth/admin-sessions."""

from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.auth_session import AuthSession
from app.system.permissions.session_permission import SessionPermission as P
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/admin-sessions"


class TestAdminSessionListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/system/auth/admin-sessions."""

    def test_list_sessions_success_with_search_filter(self, staff: Any, user: Any, login: Any) -> None:
        """Lấy danh sách phiên với tìm kiếm email và lọc trạng thái ACTIVE."""
        grant(staff, P.SESSION_READ)
        login(user)
        admin = login(staff)

        items, meta = self.assert_paginated(
            admin.get(URL, {"page": 1, "search": user.email, "status": "ACTIVE"})
        )
        assert meta["total"] == 1
        assert items[0]["user_email"] == user.email
        assert items[0]["user_id"] == str(user.pk)
        assert items[0]["status"] == "ACTIVE"
        assert items[0]["is_current"] is False
        assert not {"token", "token_hash", "refresh_token", "password"} & items[0].keys()

    def test_list_filter_multiple_users_and_status(
        self, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Nhiều người dùng kết hợp OR; trạng thái và tìm kiếm tiếp tục thu hẹp bằng AND."""
        login(user)
        login(user)
        AuthSession.objects.filter(user=user).update(expires_at=timezone.now() - timedelta(seconds=1))
        login(superuser)
        grant(staff, P.SESSION_READ)
        api = login(staff)

        users = f"{user.pk},{superuser.pk}"
        items, meta = self.assert_paginated(api.get(URL, {"page": 1, "user": users}))
        assert meta["total"] == 3
        assert {item["user_id"] for item in items} == {str(user.pk), str(superuser.pk)}

        items, meta = self.assert_paginated(
            api.get(URL, {"page": 1, "user": users, "status": "EXPIRED", "search": user.email})
        )
        assert meta["total"] == 2
        assert all(item["user_id"] == str(user.pk) for item in items)

    def test_list_status_filter_multiple_values(self, superuser: Any, user: Any, login: Any) -> None:
        """Bộ lọc status hỗ trợ nhiều giá trị phân tách dấu phẩy (ACTIVE,EXPIRED)."""
        login(user)
        AuthSession.objects.filter(user=user).update(expires_at=timezone.now() - timedelta(seconds=1))
        admin = login(superuser)

        _, meta = self.assert_paginated(admin.get(URL, {"page": 1, "status": "ACTIVE,EXPIRED"}))
        assert meta["total"] == 2

        _, meta = self.assert_paginated(admin.get(URL, {"page": 1, "status": "REVOKED"}))
        assert meta["total"] == 0

    def test_list_validation_error(self, superuser: Any, login: Any) -> None:
        """Tham số bộ lọc không hợp lệ trả về 400 VALIDATION_ERROR."""
        admin = login(superuser)
        self.assert_error(admin.get(URL, {"status": "INVALID"}), 400, "VALIDATION_ERROR")
        self.assert_error(admin.get(URL, {"user": "invalid"}), 400, "VALIDATION_ERROR")

    def test_list_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, staff: Any, login: Any) -> None:
        """Staff thiếu quyền auth.session.read bị 403."""
        res = login(staff).get(URL)
        self.assert_forbidden(res)
