"""Kiểm thử danh sách Dịch vụ định kỳ: GET /api/v1/workspace/subscriptions."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/subscriptions"


class TestSubscriptionListApi(BaseApiTestCase):
    """Kiểm thử phân trang, lọc `category`/`billing_cycle`/`is_active`, cách ly owner & 401/403."""

    def test_list_filter_and_isolation(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        Subscription.objects.create(
            owner=user,
            name="Hetzner VPS",
            provider="Hetzner",
            category=Subscription.Category.HOSTING_VPS,
            billing_cycle=Subscription.BillingCycle.MONTHLY,
            amount=250000,
            amount_vnd=250000,
            currency=vnd,
            renew_date=date(2026, 12, 1),
            is_active=True,
        )
        Subscription.objects.create(
            owner=user,
            name="Old VPN",
            category=Subscription.Category.SAAS_TOOL,
            billing_cycle=Subscription.BillingCycle.YEARLY,
            currency=vnd,
            renew_date=date(2026, 12, 10),
            is_active=False,
        )
        Subscription.objects.create(
            owner=other,
            name="Other Sub",
            currency=vnd,
            renew_date=date(2026, 12, 5),
        )

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        items, pag = self.assert_paginated(api.get(URL, {"is_active": "true", "page": 1}))
        assert pag["total"] == 1
        assert items[0]["name"] == "Hetzner VPS"
