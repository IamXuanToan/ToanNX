"""Test UserContext: context không rò ra ngoài phạm vi request."""

from typing import Any

from app.account.tests.factories.user_factory import UserFactory
from app.core.context.user_context import get_request_id, get_user_id, request_context, set_current_user


def test_request_id_resets() -> None:
    assert get_request_id() is None
    with request_context("req-12345678"):
        assert get_request_id() == "req-12345678"
    assert get_request_id() is None


def test_user_resets_after_scope(db: Any) -> None:
    user = UserFactory()
    with request_context("req-12345678"):
        set_current_user(user)
        assert get_user_id() == user.pk
    assert get_user_id() is None
