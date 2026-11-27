"""Kiểm thử cập nhật Thiết bị: PATCH /api/v1/workspace/assets/{id}."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.exchange_rate import ExchangeRate
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission as P

pytestmark = pytest.mark.django_db


class TestAssetUpdateApi(BaseApiTestCase):
    """Kiểm thử sửa thiết bị, đổi ngoại tệ tính lại VNĐ, cô lập owner & 401/403."""

    def test_update_success_and_currency_recalc(
        self, user: Any, login: Any, vnd: Any, usd: Any, client: Any
    ) -> None:
        other = UserFactory()
        mine = Asset.objects.create(
            owner=user, name="Màn Dell", purchase_date=date(2026, 11, 1), currency=vnd
        )
        theirs = Asset.objects.create(owner=other, name="Khác", purchase_date=date(2026, 11, 1), currency=vnd)

        self.assert_unauthorized(client.patch(f"/api/v1/workspace/assets/{mine.pk}", {}, format="json"))
        self.assert_forbidden(
            login(user).patch(f"/api/v1/workspace/assets/{mine.pk}", {}, format="json"),
            "PERMISSION_DENIED",
        )

        grant(user, P.UPDATE)
        api = login(user)
        ExchangeRate.objects.create(
            currency=usd,
            rate_date=date(2026, 11, 1),
            rate=Decimal("25000"),
            source=ExchangeRate.Source.MANUAL,
        )
        res = api.patch(
            f"/api/v1/workspace/assets/{mine.pk}",
            {"name": "Màn Dell U2723QE", "currency_id": str(usd.pk), "purchase_price": "500"},
            format="json",
        )
        data = self.assert_success(res)
        assert data["name"] == "Màn Dell U2723QE"
        assert data["purchase_price_vnd"] == "12500000"

        self.assert_error(
            api.patch(f"/api/v1/workspace/assets/{theirs.pk}", {"name": "X"}, format="json"),
            404,
            "NOT_FOUND",
        )
