"""Kiểm thử gia hạn gói định kỳ: POST /api/v1/workspace/subscriptions/{id}/renew."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.exchange_rate import ExchangeRate
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db


class TestSubscriptionRenewApi(BaseApiTestCase):
    """Kiểm thử `anchor_day` ngày 31 qua tháng 2 và tra tỷ giá `<= paid_on` (không dùng rate cũ)."""

    def test_renew_clamped_anchor_day_across_february(self, user: Any, login: Any, vnd: Any) -> None:
        sub = Subscription.objects.create(
            owner=user,
            name="SaaS Anchor 31",
            billing_cycle=Subscription.BillingCycle.MONTHLY,
            anchor_day=31,
            amount=Decimal("200000"),
            amount_vnd=Decimal("200000"),
            currency=vnd,
            renew_date=date(2026, 1, 31),
        )
        grant(user, P.UPDATE)
        api = login(user)

        # Tháng 1 (31) → Tháng 2 (28/02/2026)
        p1 = self.assert_success(
            api.post(
                f"/api/v1/workspace/subscriptions/{sub.pk}/renew",
                {"paid_on": "2026-01-31"},
                format="json",
            ),
            201,
        )
        assert p1["period_from"] == "2026-01-31"
        assert p1["period_to"] == "2026-02-28"

        # Tháng 2 (28) → Tháng 3: phải phục hồi lại đúng ngày chốt `anchor_day=31` (31/03/2026)!
        p2 = self.assert_success(
            api.post(
                f"/api/v1/workspace/subscriptions/{sub.pk}/renew",
                {"paid_on": "2026-02-28"},
                format="json",
            ),
            201,
        )
        assert p2["period_from"] == "2026-02-28"
        assert p2["period_to"] == "2026-03-31"

    def test_renew_foreign_currency_uses_rate_at_paid_on_not_stale_subscription_rate(
        self, user: Any, login: Any, usd: Any
    ) -> None:
        sub = Subscription.objects.create(
            owner=user,
            name="USD VPS",
            billing_cycle=Subscription.BillingCycle.MONTHLY,
            anchor_day=15,
            amount=Decimal("10.00"),
            currency=usd,
            exchange_rate=Decimal("24000"),
            amount_vnd=Decimal("240000"),
            renew_date=date(2026, 11, 15),
        )
        grant(user, P.UPDATE)
        api = login(user)

        # Chưa có ExchangeRate quanh ngày paid_on=2026-11-15 → bắt buộc báo thiếu tỷ giá (cấm dùng 24000 cũ).
        err = api.post(
            f"/api/v1/workspace/subscriptions/{sub.pk}/renew",
            {"paid_on": "2026-11-15"},
            format="json",
        )
        self.assert_error(err, 400, "WORKSPACE_CURRENCY_RATE_REQUIRED")

        ExchangeRate.objects.create(
            currency=usd,
            rate_date=date(2026, 11, 14),
            rate=Decimal("25600"),
            source=ExchangeRate.Source.MANUAL,
        )
        ok = self.assert_success(
            api.post(
                f"/api/v1/workspace/subscriptions/{sub.pk}/renew",
                {"paid_on": "2026-11-15"},
                format="json",
            ),
            201,
        )
        assert ok["exchange_rate"] == "25600.000000"
        assert ok["amount_vnd"] == "256000"
