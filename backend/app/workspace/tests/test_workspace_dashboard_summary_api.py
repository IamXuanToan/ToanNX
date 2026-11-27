"""Kiểm thử Dashboard Summary: GET /api/v1/workspace/dashboard/summary."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.workspace_dashboard_permission import WorkspaceDashboardPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/dashboard/summary"


class TestWorkspaceDashboardSummaryApi(BaseApiTestCase):
    """Kiểm thử KPI tổng hợp (Chi tiêu, Nhắc việc, Bảo hành, Gia hạn) và cô lập `?owner=`."""

    def test_summary_kpis_and_owner_scoping(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        today = timezone.localdate()

        Asset.objects.create(
            owner=user,
            name="Phone",
            purchase_date=today,
            purchase_price=Decimal("20000000"),
            purchase_price_vnd=Decimal("20000000"),
            warranty_end_date=today + timedelta(days=10),
            currency=vnd,
        )
        sub = Subscription.objects.create(
            owner=user,
            name="VPS",
            amount=Decimal("200000"),
            amount_vnd=Decimal("200000"),
            currency=vnd,
            renew_date=today + timedelta(days=5),
        )
        SubscriptionPayment.objects.create(
            owner=user,
            subscription=sub,
            paid_on=today,
            period_from=today - timedelta(days=30),
            period_to=today,
            amount=Decimal("200000"),
            amount_vnd=Decimal("200000"),
            currency=vnd,
        )
        Reminder.objects.create(owner=user, title="Việc hôm nay", due_date=today)

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        # ?owner=other bị bỏ qua nếu không có MANAGE_ALL
        data = self.assert_success(api.get(URL, {"owner": str(other.pk)}))
        assert data["owner_id"] == str(user.pk)
        assert data["monthly_spending_vnd"] == "20200000"
        assert data["pending_reminders_today"] == 1
        assert data["expiring_warranties_30d"] == 1
        assert data["upcoming_subscriptions_14d"] == 1
        assert "monitors_total" not in data
        assert "monitors_healthy" not in data

        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        other_summary = self.assert_success(login(user).get(URL, {"owner": str(other.pk)}))
        assert other_summary["owner_id"] == str(other.pk)
        assert other_summary["monthly_spending_vnd"] == "0"
        assert other_summary["pending_reminders_today"] == 0
        assert date.fromisoformat(other_summary["today"])
