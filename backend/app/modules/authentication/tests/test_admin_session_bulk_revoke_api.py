"""Kiểm thử endpoint thu hồi hàng loạt phiên quản trị: POST /api/v1/auth/admin-sessions/bulk-revoke."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.session_permission import SessionPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/admin-sessions/bulk-revoke"


class TestAdminSessionBulkRevokeApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/auth/admin-sessions/bulk-revoke."""

    def test_bulk_revoke_success(self, staff: Any, user: Any, login: Any) -> None:
        """Thu hồi hàng loạt phiên thành công."""
        target = login(user)
        login(user)
        ids = [str(pk) for pk in AuthSession.objects.filter(user=user).values_list("pk", flat=True)]

        grant(staff, P.SESSION_REVOKE)
        admin = login(staff)
        res = admin.post(URL, {"ids": ids}, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2
        assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).count() == 0
        self.assert_unauthorized(target.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")

        # Thu hồi lại trả về count 0
        again = admin.post(URL, {"ids": ids}, format="json")
        assert again.json()["data"]["count"] == 0

    def test_bulk_revoke_rejects_staff_targeting_superuser(
        self, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Staff không thể thu hồi phiên chứa superuser trong danh sách (403)."""
        login(user)
        login(superuser)
        ids = [str(pk) for pk in AuthSession.objects.filter(user=user).values_list("pk", flat=True)]
        super_id = str(AuthSession.objects.get(user=superuser).pk)

        grant(staff, P.SESSION_REVOKE)
        admin = login(staff)
        res = admin.post(URL, {"ids": [*ids, super_id]}, format="json")
        self.assert_forbidden(res)
        assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).count() == 1

    def test_bulk_revoke_validation(self, superuser: Any, login: Any) -> None:
        """Kiểm tra validation danh sách ids rỗng hoặc UUID không hợp lệ."""
        admin = login(superuser)
        self.assert_error(admin.post(URL, {"ids": []}, format="json"), 400, "VALIDATION_ERROR")
        self.assert_error(admin.post(URL, {"ids": ["invalid-uuid"]}, format="json"), 400, "VALIDATION_ERROR")

    def test_bulk_revoke_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": ["00000000-0000-0000-0000-000000000000"]}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_revoke_forbidden_without_permission(self, staff: Any, user: Any, login: Any) -> None:
        """Staff chỉ có SESSION_READ nhưng thiếu SESSION_REVOKE bị 403."""
        grant(staff, P.SESSION_READ)
        admin = login(staff)
        res = admin.post(URL, {"ids": [str(user.pk)]}, format="json")
        self.assert_forbidden(res)
