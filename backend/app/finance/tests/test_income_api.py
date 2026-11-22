"""CRUD /finance/incomes: nhập tay, khóa VNĐ của SePay, tỷ giá không có, phân quyền theo người tạo."""

from typing import Any

import pytest

from app.finance.models.income import Income
from app.finance.tests.helpers.finance_test_helper import (
    currency,
    make_connection,
    make_platform,
    payload,
    signed_post,
)
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/finance/incomes"
MEMBER = (
    "finance.income.read",
    "finance.income.create",
    "finance.income.update",
    "finance.income.delete",
    "finance.report.read",
    "system.currency.read",
)


def test_exchange_rate_unavailable(superuser: Any, login: Any) -> None:
    api = login(superuser)
    data = {
        "currency_id": str(currency("USD").pk),
        "received_at": "2026-12-10T10:00:00+07:00",  # 7 ngày trước đó không có tỷ giá giả
        "original_amount": "10",
    }
    response = api.post(URL, data, format="json")
    assert (
        response.status_code == 422
        and response.json()["error"]["code"] == "FINANCE_EXCHANGE_RATE_UNAVAILABLE"
    )
    assert not Income.objects.exists()


def test_sepay_amount_is_locked(superuser: Any, login: Any, client: Any) -> None:
    connection = make_connection(superuser)
    signed_post(client, connection, payload(1, "2026-12-12 09:00:00", "X", 12800000))
    income = Income.objects.get()
    response = login(superuser).patch(
        f"{URL}/{income.pk}",
        {"currency_id": str(currency("VND").pk), "original_amount": "13000000"},
        format="json",
    )
    assert response.status_code == 422 and response.json()["error"]["code"] == "FINANCE_AMOUNT_LOCKED"


def test_inactive_currency(superuser: Any, login: Any) -> None:
    usd = currency("USD")
    usd.is_active = False
    usd.save()
    data = {"currency_id": str(usd.pk), "received_at": "2026-12-15T10:00:00+07:00", "original_amount": "10"}
    response = login(superuser).post(URL, data, format="json")
    assert response.status_code == 422 and response.json()["error"]["code"] == "SYSTEM_CURRENCY_INACTIVE"


def test_member_sees_only_own(login: Any) -> None:
    owner_a, owner_b = UserFactory(), UserFactory()
    grant(owner_a, *MEMBER)
    grant(owner_b, *MEMBER)
    vnd = str(currency("VND").pk)
    data = {"currency_id": vnd, "received_at": "2026-12-15T10:00:00+07:00", "original_amount": "1000000"}
    api_a, api_b = login(owner_a), login(owner_b)
    income_id = api_a.post(URL, data, format="json").json()["data"]["id"]
    api_b.post(URL, data, format="json")
    assert api_b.get(URL).json()["data"].__len__() == 1
    assert api_b.patch(f"{URL}/{income_id}", {"note": "x"}, format="json").status_code == 404
    assert api_b.delete(f"{URL}/{income_id}").status_code == 404
    totals = api_b.get("/api/v1/finance/reports/summary", {"year": 2026}).json()["data"]["totals"]
    assert totals["total"] == "1000000"


def test_platform_of_other_user_is_rejected(login: Any, superuser: Any) -> None:
    owner = UserFactory()
    grant(owner, *MEMBER)
    other_platform = make_platform(superuser, "x", "X")
    data = {
        "currency_id": str(currency("VND").pk),
        "received_at": "2026-12-15T10:00:00+07:00",
        "original_amount": "1",
        "platform_id": str(other_platform.pk),
    }
    response = login(owner).post(URL, data, format="json")
    assert response.status_code == 422 and response.json()["error"]["code"] == "FINANCE_PLATFORM_INVALID"
