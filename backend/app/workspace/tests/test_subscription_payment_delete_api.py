"""Kiểm thử xóa Lịch sử thanh toán gia hạn: DELETE /api/v1/workspace/subscription-payments/{id}."""

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


class TestSubscriptionPaymentDeleteApi(BaseApiTestCase):
    """Kiểm thử xóa mềm một lịch sử thanh toán."""

    def test_delete_success(self, user: Any, login: Any, vnd: Any) -> None:
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
        assert login(user).delete(f"/api/v1/workspace/subscription-payments/{pay.pk}").status_code == 204
