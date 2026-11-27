"""Kiểm thử cập nhật Dịch vụ định kỳ: PATCH /api/v1/workspace/subscriptions/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db


class TestSubscriptionUpdateApi(BaseApiTestCase):
    """Kiểm thử PATCH cập nhật giá/trạng thái."""

    def test_update_success(self, user: Any, login: Any, vnd: Any) -> None:
        sub = Subscription.objects.create(
            owner=user,
            name="Domain",
            amount=250000,
            amount_vnd=250000,
            currency=vnd,
            renew_date=date(2026, 12, 1),
        )
        grant(user, P.UPDATE)
        res = login(user).patch(
            f"/api/v1/workspace/subscriptions/{sub.pk}",
            {"amount": "320000", "is_active": False},
            format="json",
        )
        data = self.assert_success(res)
        assert data["amount_vnd"] == "320000"
        assert data["is_active"] is False
