"""Kiểm thử endpoint xóa lô tỷ giá: POST /api/v1/system/exchange-rates/bulk-delete."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.currency import Currency
from app.system.models.exchange_rate import ExchangeRate
from app.system.permissions.exchange_rate_permission import ExchangeRatePermission as P
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/exchange-rates/bulk-delete"


def _make(owner: Any, n: int) -> ExchangeRate:
    """Tạo tỷ giá thứ `n` (tài nguyên dùng chung thì bỏ qua `owner`)."""
    return ExchangeRate.objects.create(
        currency=Currency.objects.get(code="USD"),
        rate_date=date(2020, 1, n),
        rate=Decimal(25000),
        source=ExchangeRate.Source.MANUAL,
    )


class TestExchangeRateBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/exchange-rates/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm cả lô thành công, trả số bản ghi đã xử lý."""
        grant(user, P.DELETE)
        items = [_make(user, 1), _make(user, 2)]
        api = login(user)

        res = api.post(URL, {"ids": [str(item.pk) for item in items]}, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.deleted_at is not None

    def test_bulk_delete_validation_missing_ids(self, user: Any, login: Any) -> None:
        """Thiếu `ids` bị 400 VALIDATION_ERROR."""
        grant(user, P.DELETE)
        api = login(user)

        error = self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": []}, format="json"))

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền xóa bị 403."""
        self.assert_forbidden(login(user).post(URL, {"ids": []}, format="json"))
