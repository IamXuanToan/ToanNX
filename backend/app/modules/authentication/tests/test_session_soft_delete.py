"""Kiểm tra xóa mềm phiên và bảo vệ quyền."""

from typing import Any

import pytest

from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.session_permission import SessionPermission as P
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/admin-sessions/bulk-delete"


def test_soft_delete_invalidates_tokens_and_hides_history(
    staff: Any,
    user: Any,
    login: Any,
) -> None:
    """Xóa giữ bản ghi nhưng phiên biến mất khỏi API và không dùng token được nữa."""
    target = login(user)
    session = AuthSession.objects.get(user=user)
    grant(staff, P.SESSION_READ, P.SESSION_REVOKE)
    admin = login(staff)
    body = {"ids": [str(session.pk)]}
    assert admin.post(URL, body, content_type="application/json").status_code == 403
    grant(staff, P.SESSION_DELETE)
    admin = login(staff)
    response = admin.post(URL, body, content_type="application/json")
    assert response.status_code == 200
    assert response.json()["data"]["count"] == 1
    session.refresh_from_db()
    assert session.deleted_at is not None
    assert session.revoked_at is not None
    assert target.get("/api/v1/auth/me").status_code == 401
    assert target.post("/api/v1/auth/refresh").status_code == 401
    response = admin.get("/api/v1/auth/admin-sessions", {"user": str(user.pk)})
    assert response.json()["data"] == []


def test_bulk_delete_protects_superuser_atomically(
    staff: Any,
    user: Any,
    superuser: Any,
    login: Any,
) -> None:
    """Một phiên được bảo vệ khiến cả lô không bị thay đổi."""
    login(user)
    login(superuser)
    ids = list(AuthSession.objects.values_list("pk", flat=True))
    grant(staff, P.SESSION_DELETE)
    response = login(staff).post(URL, {"ids": [str(pk) for pk in ids]}, content_type="application/json")
    assert response.status_code == 403
    assert not AuthSession.objects.filter(deleted_at__isnull=False).exists()
