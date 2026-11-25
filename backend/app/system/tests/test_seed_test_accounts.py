"""Kiểm thử lệnh `seed_test_accounts`: tạo tài khoản mẫu, chạy lại ổn định và chặn ngoài DEBUG."""

from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

from app.system.models.user import User

pytestmark = pytest.mark.django_db


@override_settings(DEBUG=True)
def test_seed_test_accounts_creates_roles_and_is_idempotent() -> None:
    """Chạy hai lần đều giữ nguyên đúng tài khoản, cờ is_staff và vai trò IAM."""
    call_command("seed_test_accounts", stdout=StringIO())
    call_command("seed_test_accounts", stdout=StringIO())

    admin = User.objects.alive().get(email="admin@toannx.local")
    viewer = User.objects.alive().get(email="finance.viewer@toannx.local")
    member = User.objects.alive().get(email="finance.member@toannx.local")
    portal = User.objects.alive().get(email="portal.member@toannx.local")

    assert admin.is_staff and viewer.is_staff
    assert not member.is_staff and not portal.is_staff
    assert admin.check_password("Toannx@123")
    assert portal.user_roles.alive().filter(role__code="UTILITIES_MEMBER").exists()
    assert portal.user_roles.alive().filter(role__code="FINANCE_MEMBER").exists()
    assert portal.user_roles.alive().filter(role__code="SYSTEM_MEMBER").exists()


@override_settings(DEBUG=False)
def test_seed_test_accounts_refuses_when_debug_disabled() -> None:
    """Không cho phép seed tài khoản mẫu ở môi trường không bật DEBUG."""
    with pytest.raises(CommandError, match="DEBUG"):
        call_command("seed_test_accounts", stdout=StringIO())
