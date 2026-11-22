"""Test lệnh `seed_local`: đồng bộ quyền + superuser local, chạy lại vẫn cùng kết quả."""

from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

from app.system.models.user import User
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db


@override_settings(DEBUG=True)
def test_seed_local_creates_superuser_and_is_idempotent() -> None:
    call_command("seed_local", stdout=StringIO())
    call_command("seed_local", stdout=StringIO())
    user = User.objects.alive().get(email="nxtoan2k4@gmail.com")
    assert user.username == "toannx"
    assert user.is_superuser and user.is_staff and user.is_active
    assert user.check_password("zxcvzxcv")
    assert User.objects.alive().filter(email="nxtoan2k4@gmail.com").count() == 1


@override_settings(DEBUG=True)
def test_seed_local_promotes_existing_user() -> None:
    existing = UserFactory(email="nxtoan2k4@gmail.com", is_active=False)
    call_command("seed_local", stdout=StringIO())
    existing.refresh_from_db()
    assert existing.is_superuser and existing.is_active and existing.username == "toannx"
    assert existing.check_password("zxcvzxcv")


@override_settings(DEBUG=False)
def test_seed_local_refuses_outside_debug() -> None:
    with pytest.raises(CommandError, match="DEBUG"):
        call_command("seed_local", stdout=StringIO())
