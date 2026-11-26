"""Kiểm thử chi tiết Dịch vụ định kỳ: GET /api/v1/workspace/subscriptions/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db


class TestSubscriptionDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết gói định kỳ, owner isolation & MANAGE_ALL."""

    def test_detail_and_isolation(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        mine = Subscription.objects.create(
            owner=user, name="Mine", currency=vnd, renew_date=date(2026, 12, 1)
        )
        theirs = Subscription.objects.create(
            owner=other, name="Theirs", currency=vnd, renew_date=date(2026, 12, 1)
        )

        self.assert_unauthorized(client.get(f"/api/v1/workspace/subscriptions/{mine.pk}"))
        self.assert_forbidden(
            login(user).get(f"/api/v1/workspace/subscriptions/{mine.pk}"), "PERMISSION_DENIED"
        )

        grant(user, P.READ)
        api = login(user)
        assert self.assert_success(api.get(f"/api/v1/workspace/subscriptions/{mine.pk}"))["name"] == "Mine"
        self.assert_error(api.get(f"/api/v1/workspace/subscriptions/{theirs.pk}"), 404, "NOT_FOUND")
