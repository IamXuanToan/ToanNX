"""Test AccountAuthBackend (xác thực) + IamPermissionBackend (quyền) qua API chuẩn của Django."""

import pytest
from django.contrib.auth import authenticate, get_user_model

from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission
from app.modules.account.tests.factories.user_factory import DEFAULT_PASSWORD
from app.modules.iam.services.permission_checker import permission_checker
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


class TestAccountAuthBackend:
    """`django.contrib.auth` dùng Account làm nguồn người dùng, IAM làm nguồn quyền."""

    def test_user_model_is_account_user(self) -> None:
        assert get_user_model() is User

    def test_authenticate_with_email(self, user: User) -> None:
        assert authenticate(email=user.email.upper(), password=DEFAULT_PASSWORD) == user
        assert authenticate(username=user.email, password="wrong") is None

    def test_has_perm_delegates_to_iam(self, user: User) -> None:
        assert not user.has_perm(UserPermission.USER_READ.code)
        grant(user, UserPermission.USER_READ)
        permission_checker.invalidate(user)
        assert user.has_perm(UserPermission.USER_READ.code)
        assert user.has_module_perms("account") and not user.has_module_perms("iam")

    def test_inactive_user_has_no_perm(self, superuser: User) -> None:
        superuser.is_active = False
        assert not superuser.has_perm(UserPermission.USER_READ.code)
