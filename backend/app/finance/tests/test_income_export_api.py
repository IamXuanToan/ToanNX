"""Kiểm thử endpoint xuất CSV thu nhập: GET /api/v1/finance/incomes/export."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.finance.models.income import Income
from app.finance.tests.helpers.finance_test_helper import currency
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/finance/incomes/export"
READ_AND_CREATE = ("finance.income.read", "finance.income.create")


class TestIncomeExportApi(BaseApiTestCase):
    """Kiểm thử phân quyền, cách ly owner và trung hòa CSV Formula Injection."""

    def test_unauthenticated_returns_401(self, client: Any) -> None:
        """Chưa đăng nhập trả về 401."""
        assert client.get(URL).status_code == 401

    def test_forbidden_without_read_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền đọc thu nhập trả về 403."""
        assert login(user).get(URL).status_code == 403

    def test_export_csv_sanitizes_formula_injection_and_scopes_owner(self, login: Any) -> None:
        """Xuất CSV chỉ gồm dữ liệu của owner và gắn dấu nháy đơn trước công thức độc hại."""
        owner = UserFactory()
        other = UserFactory()
        grant(owner, *READ_AND_CREATE)
        grant(other, *READ_AND_CREATE)
        vnd = str(currency("VND").pk)

        create_res = login(owner).post(
            "/api/v1/finance/incomes",
            {
                "currency_id": vnd,
                "received_at": "2026-12-15T10:00:00+07:00",
                "original_amount": "100000",
                "content": "=cmd|'/C calc'!A0",
                "note": '@IMPORTXML("http://evil.test")',
            },
            format="json",
        )
        income_data = self.assert_success(create_res, 201)
        Income.objects.filter(pk=income_data["id"]).update(reference_code="+SUM(1,2)")

        other_res = login(other).post(
            "/api/v1/finance/incomes",
            {
                "currency_id": vnd,
                "received_at": "2026-12-15T11:00:00+07:00",
                "original_amount": "200000",
                "content": "OTHER_USER_SECRET",
            },
            format="json",
        )
        self.assert_success(other_res, 201)

        res = login(owner).get(URL)
        assert res.status_code == 200
        assert res["Content-Disposition"].startswith("attachment;")
        csv_text = res.content.decode("utf-8-sig")

        assert "'=cmd|'/C calc'!A0" in csv_text
        assert "'+SUM(1,2)" in csv_text
        assert "'@IMPORTXML" in csv_text
        assert "OTHER_USER_SECRET" not in csv_text
