"""Test xóa người dùng và thao tác hàng loạt (/account/users/{id}, /bulk-update, /bulk-delete)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission as A
from app.modules.account.tests.factories.superuser_factory import SuperuserFactory
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.authentication.models.auth_session import AuthSession

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"
BULK_UPDATE = f"{USERS}/bulk-update"
BULK_DELETE = f"{USERS}/bulk-delete"


class TestUserDelete(BaseApiTestCase):
    """Xóa mềm một người dùng."""

    def test_delete_soft_deletes_and_revokes_sessions(
        self, superuser: User, user: User, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        login(user)
        assert AuthSession.objects.filter(user=user, revoked_at__isnull=True).exists()
        api = login(superuser)
        with django_capture_on_commit_callbacks(execute=True):
            response = api.delete(f"{USERS}/{user.pk}")
        assert response.status_code == 204
        user.refresh_from_db()
        assert user.deleted_at is not None
        assert user.is_active is False
        assert not AuthSession.objects.filter(user=user, revoked_at__isnull=True).exists()
        self.assert_error(login(superuser).get(f"{USERS}/{user.pk}"), 404, "NOT_FOUND")

    def test_deleted_user_cannot_login(self, superuser: User, user: User, login: Any, client: Any) -> None:
        login(superuser).delete(f"{USERS}/{user.pk}")
        response = client.post(
            "/api/v1/auth/login", {"identifier": user.email, "password": "Str0ng-Passw0rd!"}, format="json"
        )
        assert response.status_code in (400, 401)

    def test_cannot_delete_self(self, superuser: User, login: Any) -> None:
        self.assert_error(
            login(superuser).delete(f"{USERS}/{superuser.pk}"), 403, "ACCOUNT_SELF_MODIFICATION"
        )

    def test_staff_cannot_delete_superuser(self, staff_with: Any, login: Any) -> None:
        actor = staff_with(A.USER_DELETE.code)
        target = SuperuserFactory()
        self.assert_error(login(actor).delete(f"{USERS}/{target.pk}"), 403, "ACCOUNT_SUPERUSER_PROTECTED")

    def test_delete_requires_permission(self, staff_with: Any, user: User, login: Any) -> None:
        actor = staff_with(A.USER_READ.code)
        self.assert_forbidden(login(actor).delete(f"{USERS}/{user.pk}"))


class TestUserBulkApi(BaseApiTestCase):
    """Khóa/mở và xóa nhiều người dùng."""

    def test_bulk_lock_and_unlock(self, superuser: User, login: Any) -> None:
        users = UserFactory.create_batch(3)
        ids = [str(item.pk) for item in users]
        api = login(superuser)
        assert self.assert_success(
            api.post(BULK_UPDATE, {"ids": ids, "is_active": False}, format="json")
        ) == {"count": 3}
        assert not User.objects.filter(pk__in=ids, is_active=True).exists()
        self.assert_success(api.post(BULK_UPDATE, {"ids": ids, "is_active": True}, format="json"))
        assert User.objects.filter(pk__in=ids, is_active=True).count() == 3

    def test_bulk_delete(self, superuser: User, login: Any) -> None:
        users = UserFactory.create_batch(2)
        ids = [str(item.pk) for item in users]
        data = self.assert_success(login(superuser).post(BULK_DELETE, {"ids": ids}, format="json"))
        assert data == {"count": 2}
        assert User.objects.filter(pk__in=ids, deleted_at__isnull=False).count() == 2

    def test_bulk_delete_is_all_or_nothing(self, superuser: User, login: Any) -> None:
        other = UserFactory()
        ids = [str(other.pk), str(superuser.pk)]
        self.assert_error(
            login(superuser).post(BULK_DELETE, {"ids": ids}, format="json"), 403, "ACCOUNT_SELF_MODIFICATION"
        )
        other.refresh_from_db()
        assert other.deleted_at is None

    def test_bulk_lock_protects_last_superuser(self, superuser: User, login: Any) -> None:
        user = UserFactory()
        payload = {"ids": [str(user.pk), str(superuser.pk)], "is_active": False}
        self.assert_error(
            login(superuser).post(BULK_UPDATE, payload, format="json"), 422, "ACCOUNT_LAST_SUPERUSER"
        )
        user.refresh_from_db()
        assert user.is_active is True

    def test_bulk_validation(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        self.assert_error(api.post(BULK_DELETE, {"ids": []}, format="json"), 400, "VALIDATION_ERROR")
        self.assert_error(api.post(BULK_DELETE, {"ids": ["x"]}, format="json"), 400, "VALIDATION_ERROR")
        self.assert_error(
            api.post(BULK_UPDATE, {"ids": [str(superuser.pk)]}, format="json"), 400, "VALIDATION_ERROR"
        )

    def test_bulk_requires_permission(self, staff_with: Any, user: User, login: Any) -> None:
        actor = staff_with(A.USER_UPDATE.code)
        self.assert_forbidden(login(actor).post(BULK_DELETE, {"ids": [str(user.pk)]}, format="json"))

    def test_sort_by_status(self, superuser: User, login: Any) -> None:
        UserFactory(is_active=False)
        items, _ = self.assert_paginated(login(superuser).get(f"{USERS}?page=1&ordering=is_active"))
        assert items[0]["is_active"] is False
