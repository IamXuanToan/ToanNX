"""Kiểm thử xóa hàng loạt Lịch sử thanh toán: POST /api/v1/workspace/subscription-payments/bulk-delete."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.subscription_payment_permission import (
    SubscriptionPaymentPermission as P,
)

pytestmark = pytest.mark.django_db


class TestSubscriptionPaymentBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete nhiều giao dịch thanh toán."""

    def test_bulk_delete_success(self, user: Any, login: Any, vnd: Any) -> None:
        sub = Subscription.objects.create(owner=user, name="S", currency=vnd, renew_date=date(2026, 12, 1))
        pay = SubscriptionPayment.objects.create(
            owner=user,
            subscription=sub,
            paid_on=date(2026, 11, 1),
            period_from=date(2026, 11, 1),
            period_to=date(2026, 12, 1),
            currency=vnd,
        )
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/subscription-payments/bulk-delete",
                {"ids": [str(pay.pk)]},
                format="json",
            )
        )
        assert data["count"] == 1
