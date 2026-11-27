"""Kiểm thử Lịch Tổng hợp 4 nguồn: GET /api/v1/workspace/calendar."""

from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.finance.models.income import Income
from app.finance.models.platform import Platform
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.workspace_calendar_permission import WorkspaceCalendarPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/calendar"


class TestWorkspaceCalendarApi(BaseApiTestCase):
    """Kiểm thử gom 4 nguồn theo múi giờ, chặn > 93 ngày và chặn `?owner=` khi thiếu manage_all."""

    def test_calendar_4_sources_timezone_and_range_guard(
        self, user: Any, login: Any, client: Any, vnd: Any
    ) -> None:
        other = UserFactory()

        asset = Asset.objects.create(
            owner=user,
            name="MacBook",
            purchase_date=date(2026, 1, 1),
            warranty_end_date=date(2026, 11, 20),
            currency=vnd,
        )
        AssetWarrantyClaim.objects.create(
            owner=user,
            asset=asset,
            claim_code="BH-CAL-1",
            submitted_date=date(2026, 11, 10),
            estimated_return_date=date(2026, 11, 22),
            service_center="TTBH",
            issue_description="Test",
            currency=vnd,
        )
        Subscription.objects.create(
            owner=user,
            name="Hetzner",
            amount=Decimal("200000"),
            amount_vnd=Decimal("200000"),
            currency=vnd,
            renew_date=date(2026, 11, 25),
        )
        Reminder.objects.create(owner=user, title="Gọi TTBH", due_date=date(2026, 11, 21))
        Reminder.objects.create(owner=other, title="Việc người khác", due_date=date(2026, 11, 21))
        platform = Platform.objects.create(owner=user, code="youtube", name="YouTube", default_currency=vnd)
        Income.objects.create(
            owner=user,
            platform=platform,
            currency=vnd,
            original_amount=Decimal("500000"),
            amount=Decimal("500000"),
            received_at=datetime(2026, 11, 23, 10, 0, tzinfo=UTC),
            received_date=date(2026, 11, 23),
            content="Doanh thu tháng 11",
        )
        page_path = PagePath.objects.get_or_create(
            segment="p", defaults={"name": "Trang test", "is_active": True}
        )[0]
        donate_page = Page.objects.create(
            owner=user,
            path=page_path,
            slug="donate-cal-test",
            title="Donate Test",
            page_type=Page.PageType.DONATION,
        )
        DonationTransaction.objects.create(
            owner=user,
            page=donate_page,
            sepay_id="cal-don-1",
            donor_title="Fan A",
            message="Chúc mừng",
            amount=Decimal("100000"),
            received_at=datetime(2026, 11, 24, 14, 0, tzinfo=UTC),
        )

        self.assert_unauthorized(client.get(URL, {"from": "2026-11-01", "to": "2026-11-30"}))
        self.assert_forbidden(
            login(user).get(URL, {"from": "2026-11-01", "to": "2026-11-30"}),
            "PERMISSION_DENIED",
        )

        grant(user, P.READ)
        api = login(user)

        too_long = api.get(URL, {"from": "2026-01-01", "to": "2026-12-31"})
        self.assert_error(too_long, 400, "WORKSPACE_CALENDAR_RANGE_TOO_LONG")

        # Truyền ?owner=other khi thiếu MANAGE_ALL → vẫn ép về user hiện tại, không lộ "Việc người khác".
        data = self.assert_success(
            api.get(URL, {"from": "2026-11-01", "to": "2026-11-30", "owner": str(other.pk)})
        )
        event_types = {ev["type"] for ev in data["events"]}
        assert event_types == {
            "subscription",
            "reminder",
            "asset_warranty",
            "warranty_claim",
            "income",
            "donation",
        }
        assert all("Việc người khác" not in ev["title"] for ev in data["events"])

        # Có MANAGE_ALL thì xem được ?owner=other
        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        other_data = self.assert_success(
            login(user).get(URL, {"from": "2026-11-01", "to": "2026-11-30", "owner": str(other.pk)})
        )
        assert any(ev["title"] == "Việc người khác" for ev in other_data["events"])
