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


def test_multi_owner_filter_across_finance_resources(superuser: Any, login: Any) -> None:
    """Superuser lọc nhiều owner qua `?owner=a,b`; member thiếu manage_all chỉ thấy dữ liệu của mình."""
    from app.finance.permissions.rule_permission import RulePermission
    from app.finance.tests.helpers.finance_test_helper import make_platform
    from app.system.tests.helpers.permission_helper import grant

    owner_a, owner_b = UserFactory(), UserFactory()
    perms = (
        "finance.invoice.read",
        "finance.invoice.create",
        "finance.platform.read",
        "finance.platform.create",
        RulePermission.READ,
        RulePermission.CREATE,
        "finance.report.read",
        "system.currency.read",
    )
    grant(owner_a, *perms)
    grant(owner_b, *perms)

    platform_a = make_platform(owner_a, "p-a", "Platform A")
    platform_b = make_platform(owner_b, "p-b", "Platform B")
    api_a = login(owner_a)
    api_b = login(owner_b)
    api_admin = login(superuser)

    assert (
        api_a.post(
            "/api/v1/finance/rules",
            {"name": "Rule A", "pattern": "RULEA", "platform_id": str(platform_a.pk)},
            format="json",
        ).status_code
        == 201
    )
    assert (
        api_b.post(
            "/api/v1/finance/rules",
            {"name": "Rule B", "pattern": "RULEB", "platform_id": str(platform_b.pk)},
            format="json",
        ).status_code
        == 201
    )
    vnd = str(currency("VND").pk)
    api_a.post(
        URL,
        {
            "doc_type": "INVOICE",
            "issuer": "Issuer A",
            "number": "INV-A1",
            "issued_on": "2026-08-01",
            "currency_id": vnd,
            "original_amount": "1000000",
            "attachment_ids": [_file(owner_a)],
        },
        format="json",
    )
    api_b.post(
        URL,
        {
            "doc_type": "INVOICE",
            "issuer": "Issuer B",
            "number": "INV-B1",
            "issued_on": "2026-08-02",
            "currency_id": vnd,
            "original_amount": "2000000",
            "attachment_ids": [_file(owner_b)],
        },
        format="json",
    )

    pair = f"{owner_a.pk},{owner_b.pk}"
    assert len(api_admin.get(URL, {"owner": pair}).json()["data"]) == 2
    assert len(api_admin.get("/api/v1/finance/platforms", {"owner": pair}).json()["data"]) == 2
    assert len(api_admin.get("/api/v1/finance/rules", {"owner": pair}).json()["data"]) == 2
    assert api_admin.get("/api/v1/finance/reports/monthly", {"year": 2026, "owner": pair}).status_code == 200

    # Member A truyền owner B phải bị cô lập (không thấy dữ liệu của B)
    assert api_a.get(URL, {"owner": str(owner_b.pk)}).json()["data"] == []
    assert api_a.get("/api/v1/finance/platforms", {"owner": str(owner_b.pk)}).json()["data"] == []
    assert api_a.get("/api/v1/finance/rules", {"owner": str(owner_b.pk)}).json()["data"] == []
