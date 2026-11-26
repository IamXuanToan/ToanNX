"""Kiểm thử tạo Dịch vụ định kỳ: POST /api/v1/workspace/subscriptions."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/subscriptions"


class TestSubscriptionCreateApi(BaseApiTestCase):
    """Kiểm thử tạo đầy đủ/tối thiểu, bắt buộc `custom_cycle_days > 0` khi chọn CUSTOM_DAYS và 401/403."""

    def test_create_success_and_custom_cycle_validation(
        self, user: Any, login: Any, client: Any, vnd: Any
    ) -> None:
        self.assert_unauthorized(client.post(URL, {}, format="json"))
        self.assert_forbidden(login(user).post(URL, {}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CREATE)
        api = login(user)

        missing_days = api.post(
            URL,
            {
                "name": "Gói Custom",
                "billing_cycle": "CUSTOM_DAYS",
                "amount": "100000",
                "currency_id": str(vnd.pk),
                "renew_date": "2026-12-31",
            },
            format="json",
        )
        self.assert_error(missing_days, 400, "WORKSPACE_CUSTOM_CYCLE_DAYS_REQUIRED")

        created = api.post(
            URL,
            {
                "name": "Cloudflare Pro",
                "provider": "Cloudflare",
                "category": "SAAS_TOOL",
                "billing_cycle": "MONTHLY",
                "amount": "500000",
                "currency_id": str(vnd.pk),
                "renew_date": "2026-01-31",
                "auto_renew": True,
                "payment_method": "Visa •••• 9999",
            },
            format="json",
        )
        data = self.assert_success(created, 201)
        assert data["anchor_day"] == 31
        assert data["amount_vnd"] == "500000"
        assert data["notification_channels"] == ["WEBSITE"]

        with_channels = api.post(
            URL,
            {
                "name": "Hetzner Cloud",
                "amount": "200000",
                "currency_id": str(vnd.pk),
                "renew_date": "2026-12-20",
                "notification_channels": ["WEBSITE", "TELEGRAM", "EMAIL"],
            },
            format="json",
        )
        assert self.assert_success(with_channels, 201)["notification_channels"] == [
            "WEBSITE",
            "TELEGRAM",
            "EMAIL",
        ]

        bad_ch = api.post(
            URL,
            {
                "name": "Bad sub",
                "amount": "100000",
                "currency_id": str(vnd.pk),
                "renew_date": "2026-12-21",
                "notification_channels": [],
            },
            format="json",
        )
        self.assert_error(bad_ch, 400, "VALIDATION_ERROR")
