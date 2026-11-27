"""Kiểm thử xóa hàng loạt Dịch vụ định kỳ: POST /api/v1/workspace/subscriptions/bulk-delete."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P

pytestmark = pytest.mark.django_db


class TestSubscriptionBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử xóa hàng loạt dịch vụ định kỳ."""

    def test_bulk_delete_success(self, user: Any, login: Any, vnd: Any) -> None:
        s1 = Subscription.objects.create(owner=user, name="S1", currency=vnd, renew_date=date(2026, 12, 1))
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/subscriptions/bulk-delete", {"ids": [str(s1.pk)]}, format="json"
            )
        )
        assert data["count"] == 1
