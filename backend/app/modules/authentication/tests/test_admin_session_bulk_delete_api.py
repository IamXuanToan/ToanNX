"""Kiểm thử endpoint xóa hàng loạt phiên quản trị: POST /api/v1/auth/admin-sessions/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.session_permission import SessionPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/admin-sessions/bulk-delete"


class TestAdminSessionBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/auth/admin-sessions/bulk-delete."""

    def test_soft_delete_invalidates_tokens_and_hides_history(
        self, staff: Any, user: Any, login: Any
    ) -> None:
        """Xóa giữ bản ghi nhưng phiên biến mất khỏi API và không dùng token được nữa."""
        target = login(user)
        session = AuthSession.objects.get(user=user)
        grant(staff, P.SESSION_READ, P.SESSION_REVOKE)
        admin = login(staff)
        body = {"ids": [str(session.pk)]}
        assert admin.post(URL, body, format="json").status_code == 403

        grant(staff, P.SESSION_DELETE)
        admin = login(staff)
        res = admin.post(URL, body, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 1

        session.refresh_from_db()
        assert session.deleted_at is not None
        assert session.revoked_at is not None
        assert target.get("/api/v1/auth/me").status_code == 401
        assert target.post("/api/v1/auth/refresh").status_code == 401
        res_list = admin.get("/api/v1/auth/admin-sessions", {"user": str(user.pk)})
        assert res_list.json()["data"] == []

    def test_bulk_delete_protects_superuser_atomically(
        self, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Một phiên superuser trong danh sách khiến cả lô bị từ chối và rollback toàn bộ (403)."""
        login(user)
        login(superuser)
        ids = list(AuthSession.objects.values_list("pk", flat=True))
        grant(staff, P.SESSION_DELETE)
        res = login(staff).post(URL, {"ids": [str(pk) for pk in ids]}, format="json")
        self.assert_forbidden(res)
        assert not AuthSession.objects.filter(deleted_at__isnull=False).exists()

    def test_bulk_delete_validation(self, superuser: Any, login: Any) -> None:
        """Kiểm tra validation danh sách ids rỗng hoặc không hợp lệ."""
        admin = login(superuser)
        self.assert_error(admin.post(URL, {"ids": []}, format="json"), 400, "VALIDATION_ERROR")
        self.assert_error(admin.post(URL, {"ids": ["not-uuid"]}, format="json"), 400, "VALIDATION_ERROR")

    def test_bulk_delete_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": ["00000000-0000-0000-0000-000000000000"]}, format="json")
        self.assert_unauthorized(res)
