"""Hóa đơn / chứng từ (plan 14.4): file bắt buộc, gắn giao dịch của mình, đối chiếu, không đổi báo cáo."""

from typing import Any

import pytest

from app.finance.tests.helpers.finance_test_helper import currency
from app.finance.tests.scenarios.finance_2026 import build
from app.system.services.attachment_service import AttachmentService
from app.system.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/finance/invoices"


def _file(owner: Any) -> str:
    from app.core.tests.test_list_query_count import segno_png

    return str(AttachmentService().create_generated(owner, segno_png(), "chung-tu.png").pk)


def test_withholding_certificate_reconciles(superuser: Any, login: Any, client: Any) -> None:
    api = login(superuser)
    ids = build(api, client, superuser)
    data = {
        "doc_type": "WITHHOLDING_CERTIFICATE",
        "issuer": "Meta Platforms Ireland",
        "number": "FB-2026-H2",
        "issued_on": "2026-12-31",
        "period_from": "2026-07-01",
        "period_to": "2026-12-31",
        "platform_id": str(ids["facebook"].pk),
        "currency_id": str(currency("VND").pk),
        "original_amount": "35000000",
        "original_tax_amount": "3500000",
        "attachment_ids": [_file(superuser)],
        "income_ids": [str(ids["S4"]), str(ids["S13"]), str(ids["S16"])],
    }
    response = api.post(URL, data, format="json")
    assert response.status_code == 201, response.content
    reconciliation = response.json()["data"]["reconciliation"]
    assert reconciliation["income_amount"] == "31500000" and reconciliation["income_tax_amount"] == "3500000"
    assert reconciliation["gross_difference"] == "0" and reconciliation["tax_difference"] == "0"
    duplicate = api.post(URL, {**data, "income_ids": []}, format="json")
    assert duplicate.json()["error"]["code"] == "FINANCE_INVOICE_DUPLICATE"
    no_invoice = api.get(
        "/api/v1/finance/incomes", {"year": 2026, "has_invoice": "false", "amount_status": "OK"}
    ).json()["data"]
    assert len(no_invoice) == 12  # 15 − 3 giao dịch đã gắn
    assert (
        api.get("/api/v1/finance/reports/summary", {"year": 2026}).json()["data"]["totals"]["total"]
        == "141775000"
    )


def test_usd_invoice_and_validation(superuser: Any, login: Any, client: Any) -> None:
    api = login(superuser)
    ids = build(api, client, superuser)
    base = {
        "doc_type": "INVOICE",
        "issuer": "Khách A",
        "number": "INV-001",
        "issued_on": "2026-12-10",
        "currency_id": str(currency("USD").pk),
        "original_amount": "300.00",
        "rate_source": "MANUAL",
        "exchange_rate": "25000",
    }
    created = api.post(
        URL, {**base, "attachment_ids": [_file(superuser)], "income_ids": [str(ids["S22"])]}, format="json"
    )
    assert created.status_code == 201 and created.json()["data"]["amount"] == "7500000"
    assert api.post(URL, {**base, "number": "2", "attachment_ids": []}, format="json").status_code == 400
    bad_period = {
        **base,
        "number": "3",
        "period_from": "2026-12-31",
        "period_to": "2026-07-01",
        "attachment_ids": [_file(superuser)],
    }
    assert (
        api.post(URL, bad_period, format="json").json()["error"]["code"] == "FINANCE_INVOICE_PERIOD_INVALID"
    )
    other = UserFactory()
    other_income = {
        **base,
        "number": "4",
        "attachment_ids": [_file(superuser)],
        "income_ids": [str(ids["S22"])],
    }
    other_income["income_ids"] = [str(__import__("uuid").uuid4())]
    assert (
        api.post(URL, other_income, format="json").json()["error"]["code"] == "FINANCE_INVOICE_INCOME_INVALID"
    )
    assert other.pk
