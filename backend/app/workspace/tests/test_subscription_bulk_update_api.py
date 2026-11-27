"""Kiểm thử bật/tắt hàng loạt Dịch vụ định kỳ: POST /api/v1/workspace/subscriptions/bulk-update."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db


class TestSubscriptionBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử bulk update cờ `is_active`."""

    def test_bulk_update_is_active(self, user: Any, login: Any, vnd: Any) -> None:
        s1 = Subscription.objects.create(owner=user, name="S1", currency=vnd, renew_date=date(2026, 12, 1))
        s2 = Subscription.objects.create(owner=user, name="S2", currency=vnd, renew_date=date(2026, 12, 2))
        grant(user, P.UPDATE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/subscriptions/bulk-update",
                {"ids": [str(s1.pk), str(s2.pk)], "is_active": False},
                format="json",
            )
        )
        assert data["count"] == 2
        assert Subscription.objects.filter(pk__in=[s1.pk, s2.pk], is_active=False).count() == 2
