"""Test PermissionRule: nhiều quyền (any/all), check (AND), allow_if (OR)."""

from typing import Any

import pytest
from django.test import RequestFactory
from rest_framework.request import Request

from app.core.exceptions.authorization_error import AuthorizationError
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.permissions.iam_permission import IamPermission as P
from app.modules.iam.services.permission_checker import permission_checker
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.iam.types.permission_rule import PermissionRule, permission_rule

pytestmark = pytest.mark.django_db


class _View:
    """View giả: chỉ cần `kwargs` như DRF."""

    def __init__(self, **kwargs: Any) -> None:
        self.kwargs = kwargs


def _request(user: User) -> Request:
    request = Request(RequestFactory().get("/"))
    request.user = user
    return request


def _is_owner(request: Request, view: Any) -> bool:
    return str(request.user.pk) == str(view.kwargs.get("user_id"))


class TestPermissionRule:
    """Ngữ nghĩa của PermissionRule."""

    def test_any_of_permissions(self, user: User) -> None:
        grant(user, P.ROLE_READ)
        rule = permission_rule(A.USER_READ, P.ROLE_READ)
        assert rule.is_satisfied(_request(user), _View())

    def test_require_all_permissions(self, user: User) -> None:
        grant(user, P.ROLE_READ)
        rule = permission_rule(A.USER_READ, P.ROLE_READ, require_all=True)
        assert not rule.is_satisfied(_request(user), _View())
        grant(user, A.USER_READ)
        permission_checker.invalidate(user)  # bỏ cache quyền tính ở lần kiểm tra trước
        assert rule.is_satisfied(_request(user), _View())

    def test_check_is_required_even_for_superuser(self, superuser: User) -> None:
        rule = permission_rule(
            A.USER_UPDATE, check=lambda request, view: view.kwargs["user_id"] != request.user.pk
        )
        assert not rule.is_satisfied(_request(superuser), _View(user_id=superuser.pk))
        assert rule.is_satisfied(_request(superuser), _View(user_id="other"))

    def test_allow_if_grants_without_permission(self, user: User) -> None:
        rule = permission_rule(A.USER_READ, allow_if=_is_owner)
        assert rule.is_satisfied(_request(user), _View(user_id=user.pk))
        assert not rule.is_satisfied(_request(user), _View(user_id=UserFactory().pk))

    def test_enforce_raises_with_permission_codes(self, user: User) -> None:
        with pytest.raises(AuthorizationError) as exc:
            permission_rule(A.USER_READ, P.ROLE_READ).enforce(_request(user), _View())
        assert exc.value.details == {"permissions": [A.USER_READ.code, P.ROLE_READ.code]}

    def test_empty_rule_not_allowed(self) -> None:
        with pytest.raises(ValueError, match="ít nhất"):
            PermissionRule()
