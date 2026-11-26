"""Kiểm thử Lịch Tổng hợp 5 nguồn: GET /api/v1/workspace/calendar."""

from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.models.monitor_incident import MonitorIncident
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.permissions.workspace_calendar_permission import WorkspaceCalendarPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/calendar"


class TestWorkspaceCalendarApi(BaseApiTestCase):
    """Kiểm thử gom 5 nguồn theo múi giờ, chặn > 93 ngày và chặn `?owner=` khi thiếu manage_all."""

    def test_calendar_5_sources_timezone_and_range_guard(
        self, user: Any, login: Any, client: Any, vnd: Any
    ) -> None:
        other = UserFactory()
        WorkspaceSetting.objects.create(owner=user, timezone="Asia/Ho_Chi_Minh")

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

        target = MonitorTarget.objects.create(owner=user, name="Web", url="https://example.com")
        # 2026-11-25 18:00 UTC == 2026-11-26 01:00 Asia/Ho_Chi_Minh → phải rơi vào ngày 26/11!
        MonitorIncident.objects.create(
            owner=user,
            target=target,
            started_at=datetime(2026, 11, 25, 18, 0, tzinfo=UTC),
            status_code=503,
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
            "monitor_incident",
        }
        assert all("Việc người khác" not in ev["title"] for ev in data["events"])
        inc_event = next(ev for ev in data["events"] if ev["type"] == "monitor_incident")
        assert inc_event["date"] == "2026-11-26"

        # Có MANAGE_ALL thì xem được ?owner=other
        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        other_data = self.assert_success(
            login(user).get(URL, {"from": "2026-11-01", "to": "2026-11-30", "owner": str(other.pk)})
        )
        assert any(ev["title"] == "Việc người khác" for ev in other_data["events"])
