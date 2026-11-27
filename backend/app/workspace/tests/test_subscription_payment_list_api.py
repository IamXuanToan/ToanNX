"""Kiểm thử danh sách Lịch sử thanh toán gia hạn: GET /api/v1/workspace/subscription-payments."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.subscription_payment_permission import (
    SubscriptionPaymentPermission as P,
)

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/subscription-payments"


class TestSubscriptionPaymentListApi(BaseApiTestCase):
    """Kiểm thử GET danh sách, chặn POST create = DENY (403) và cô lập owner."""

    def test_list_and_deny_direct_create(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        s1 = Subscription.objects.create(owner=user, name="Mine", currency=vnd, renew_date=date(2026, 12, 1))
        s2 = Subscription.objects.create(
            owner=other, name="Other", currency=vnd, renew_date=date(2026, 12, 1)
        )
        SubscriptionPayment.objects.create(
            owner=user,
            subscription=s1,
            paid_on=date(2026, 11, 1),
            period_from=date(2026, 11, 1),
            period_to=date(2026, 12, 1),
            amount=Decimal("100000"),
            amount_vnd=Decimal("100000"),
            currency=vnd,
        )
        SubscriptionPayment.objects.create(
            owner=other,
            subscription=s2,
            paid_on=date(2026, 11, 1),
            period_from=date(2026, 11, 1),
            period_to=date(2026, 12, 1),
            currency=vnd,
        )

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        items, pag = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pag["total"] == 1
        assert items[0]["subscription_name"] == "Mine"

        # create luôn DENY → 403
        self.assert_forbidden(api.post(URL, {}, format="json"), "PERMISSION_DENIED")
