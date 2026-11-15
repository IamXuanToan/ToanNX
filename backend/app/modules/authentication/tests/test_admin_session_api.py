"""Quản trị phiên: IAM, cách ly API cá nhân và thu hồi có hiệu lực ngay."""

from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.authentication_permission import AuthenticationPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE = "/api/v1/auth/admin-sessions"


class TestAdminSessionApi(BaseApiTestCase):
    """Đọc/thu hồi phiên của mọi người dùng theo quyền riêng."""

    def test_user_choices_follow_session_permission(
        self, client: Any, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Quyền xem phiên đủ để lấy danh mục, không cấp ngầm quyền đọc tài khoản."""
        self.assert_unauthorized(client.get(f"{BASE}/users"))
        self.assert_forbidden(login(staff).get(f"{BASE}/users"))
        grant(user, P.SESSION_READ)
        self.assert_forbidden(login(user).get(f"{BASE}/users"))
        login(user)
        grant(staff, P.SESSION_READ)
        api = login(staff)
        self.assert_forbidden(api.get("/api/v1/account/users"))
        items, meta = self.assert_paginated(api.get(f"{BASE}/users"))
        assert meta["total"] == 2
        assert {item["id"] for item in items} == {str(user.pk), str(staff.pk)}
        assert str(superuser.pk) not in {item["id"] for item in items}
        assert set(items[0]) == {"id", "email", "username", "first_name", "last_name"}
        first, page = self.assert_paginated(api.get(f"{BASE}/users", {"page_size": 1}))
        second, _ = self.assert_paginated(api.get(f"{BASE}/users", {"page_size": 1, "page": 2}))
        assert page["total_pages"] == 2
        assert first[0]["id"] != second[0]["id"]
        AuthSession.objects.filter(user=user).update(deleted_at=timezone.now())
        items, meta = self.assert_paginated(api.get(f"{BASE}/users"))
        assert meta["total"] == 1 and items[0]["id"] == str(staff.pk)

    def test_user_filter_multiple_with_status(
        self, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Nhiều người kết hợp OR; trạng thái và tìm kiếm tiếp tục thu hẹp bằng AND."""
        login(user)
        login(user)
        AuthSession.objects.filter(user=user).update(expires_at=timezone.now() - timedelta(seconds=1))
        login(superuser)
        grant(staff, P.SESSION_READ)
        api = login(staff)
        users = f"{user.pk},{superuser.pk}"
        items, meta = self.assert_paginated(api.get(BASE, {"user": users}))
        assert meta["total"] == 3
        assert {item["user_id"] for item in items} == {str(user.pk), str(superuser.pk)}
        items, meta = self.assert_paginated(
            api.get(BASE, {"user": users, "status": "EXPIRED", "search": user.email})
        )
        assert meta["total"] == 2
        assert all(item["user_id"] == str(user.pk) for item in items)

    def test_requires_admin_and_permission(self, client: Any, user: Any, staff: Any, login: Any) -> None:
        self.assert_unauthorized(client.get(BASE))
        grant(user, P.SESSION_READ)
        self.assert_forbidden(login(user).get(BASE))
        self.assert_forbidden(login(staff).get(BASE))

    def test_list_search_filter_and_safe_response(self, staff: Any, user: Any, login: Any) -> None:
        grant(staff, P.SESSION_READ)
        login(user)
        admin = login(staff)
        items, meta = self.assert_paginated(admin.get(BASE, {"search": user.email, "status": "ACTIVE"}))
        assert meta["total"] == 1
        assert items[0]["user_email"] == user.email
        assert items[0]["user_id"] == str(user.pk)
        assert items[0]["status"] == "ACTIVE"
        assert items[0]["is_current"] is False
        assert not {"token", "token_hash", "refresh_token", "password"} & items[0].keys()
        self.assert_error(admin.get(BASE, {"status": "INVALID"}), 400, "VALIDATION_ERROR")
        self.assert_error(admin.get(BASE, {"user": "invalid"}), 400, "VALIDATION_ERROR")

    def test_revoke_invalidates_target_and_retains_history(self, staff: Any, user: Any, login: Any) -> None:
        target = login(user)
        session = AuthSession.objects.get(user=user)
        grant(staff, P.SESSION_READ)
        admin = login(staff)
        self.assert_forbidden(admin.delete(f"{BASE}/{session.pk}"))
        grant(staff, P.SESSION_REVOKE)
        admin = login(staff)
        assert admin.delete(f"{BASE}/{session.pk}").status_code == 204
        session.refresh_from_db()
        assert session.revoked_reason == "admin_revoked"
        assert session.revoked_at is not None
        self.assert_unauthorized(target.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")
        items, meta = self.assert_paginated(admin.get(BASE, {"status": "REVOKED", "user": user.pk}))
        assert meta["total"] == 1
        assert items[0]["id"] == str(session.pk)

    def test_staff_cannot_revoke_superuser_session(self, staff: Any, superuser: Any, login: Any) -> None:
        login(superuser)
        session = AuthSession.objects.get(user=superuser)
        grant(staff, P.SESSION_REVOKE)
        self.assert_forbidden(login(staff).delete(f"{BASE}/{session.pk}"))
        session.refresh_from_db()
        assert session.revoked_at is None

    def test_expired_filter_and_current_revoke(self, superuser: Any, user: Any, login: Any) -> None:
        login(user)
        AuthSession.objects.filter(user=user).update(expires_at=timezone.now() - timedelta(seconds=1))
        admin = login(superuser)
        expired, meta = self.assert_paginated(admin.get(BASE, {"status": "EXPIRED"}))
        assert meta["total"] == 1
        assert expired[0]["user_id"] == str(user.pk)
        current, _ = self.assert_paginated(admin.get(BASE, {"user": superuser.pk}))
        assert current[0]["is_current"] is True
        assert admin.delete(f"{BASE}/{current[0]['id']}").status_code == 204
        self.assert_unauthorized(admin.get("/api/v1/auth/me"))

    def test_status_filter_accepts_multiple_values(self, superuser: Any, user: Any, login: Any) -> None:
        login(user)
        AuthSession.objects.filter(user=user).update(expires_at=timezone.now() - timedelta(seconds=1))
        admin = login(superuser)
        _, meta = self.assert_paginated(admin.get(BASE, {"status": "ACTIVE,EXPIRED"}))
        assert meta["total"] == 2
        _, meta = self.assert_paginated(admin.get(BASE, {"status": "REVOKED"}))
        assert meta["total"] == 0
        self.assert_error(admin.get(BASE, {"status": "ACTIVE,NOPE"}), 400, "VALIDATION_ERROR")

    def test_bulk_revoke(self, staff: Any, user: Any, superuser: Any, login: Any) -> None:
        target = login(user)
        login(user)
        login(superuser)
        ids = [str(pk) for pk in AuthSession.objects.filter(user=user).values_list("pk", flat=True)]
        super_id = str(AuthSession.objects.get(user=superuser).pk)
        grant(staff, P.SESSION_READ)
        admin = login(staff)
        self.assert_forbidden(
            admin.post(f"{BASE}/bulk-revoke", {"ids": ids}, content_type="application/json")
        )
        grant(staff, P.SESSION_REVOKE)
        admin = login(staff)
        response = admin.post(
            f"{BASE}/bulk-revoke", {"ids": [*ids, super_id]}, content_type="application/json"
        )
        self.assert_forbidden(response)
        assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).count() == 2
        response = admin.post(f"{BASE}/bulk-revoke", {"ids": ids}, content_type="application/json")
        assert response.status_code == 200
        assert response.json()["data"]["count"] == 2
        assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).count() == 0
        self.assert_unauthorized(target.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")
        again = admin.post(f"{BASE}/bulk-revoke", {"ids": ids}, content_type="application/json")
        assert again.json()["data"]["count"] == 0
