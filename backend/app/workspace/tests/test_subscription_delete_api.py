"""Kiểm thử xóa mềm Dịch vụ định kỳ: DELETE /api/v1/workspace/subscriptions/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db


class TestSubscriptionDeleteApi(BaseApiTestCase):
    """Kiểm thử DELETE 204 xóa mềm."""

    def test_delete_success(self, user: Any, login: Any, vnd: Any) -> None:
        sub = Subscription.objects.create(owner=user, name="Del", currency=vnd, renew_date=date(2026, 12, 1))
        grant(user, P.DELETE)
        assert login(user).delete(f"/api/v1/workspace/subscriptions/{sub.pk}").status_code == 204
        assert Subscription.objects.alive().filter(pk=sub.pk).exists() is False
