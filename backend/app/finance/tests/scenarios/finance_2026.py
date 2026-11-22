"""Dữ liệu kịch bản năm 2026 (plan mục 14): cấu hình, webhook giả lập, nhập tay, sửa giao dịch.

Kết quả kỳ vọng ở `EXPECTED_2026` khớp bảng 14.3 của `docs/plans/finance-refactor-plan.md`.
"""

from datetime import date
from typing import Any

from app.finance.models.income import Income
from app.finance.tests.helpers.finance_test_helper import (
    currency,
    make_connection,
    make_platform,
    payload,
    signed_post,
)

EXPECTED_2026 = {
    "count": 15,
    "total": "141775000",
    "withheld": "103200000",
    "tax": "10469298",
    "not_withheld": "38575000",
    "unclassified": "250000",
    "needs_review": 2,
}


def build(api: Any, anonymous: Any, owner: Any) -> dict[str, Any]:
    """Dựng toàn bộ dữ liệu 2026 + S19 (2025); trả id các giao dịch theo bước."""
    connection = make_connection(owner)
    facebook = make_platform(
        owner,
        "facebook",
        "Facebook",
        rates=((date(2026, 1, 1), True, "8"),),
        pattern=r"FACEBOOK|META\s*PLATFORMS",
    )
    youtube = make_platform(
        owner, "youtube", "YouTube", rates=((date(2026, 1, 1), True, "5"),), pattern=r"YOUTUBE|GOOGLE\s*ASIA"
    )
    make_platform(owner, "shopee", "Shopee", rates=((date(2026, 1, 1), False, "0"),), pattern="SHOPEE")
    freelance = make_platform(
        owner, "freelance", "Làm tự do", currency_code="USD", rates=((date(2026, 1, 1), False, "0"),)
    )
    upwork = make_platform(
        owner,
        "upwork",
        "Upwork",
        currency_code="USD",
        rates=((date(2026, 1, 1), True, "10"),),
        pattern="UPWORK",
    )
    ids: dict[str, Any] = {
        "facebook": facebook,
        "youtube": youtube,
        "freelance": freelance,
        "upwork": upwork,
        "connection": connection,
    }

    def hook(key: str, sepay_id: int, when: str, content: str, amount: Any, **extra: Any) -> None:
        response = signed_post(anonymous, connection, payload(sepay_id, when, content, amount, **extra))
        assert response.status_code == 200, response.content
        ids[key] = Income.objects.filter(sepay_id=str(sepay_id)).values_list("pk", flat=True).first()

    def manual(key: str, data: dict[str, Any]) -> None:
        response = api.post("/api/v1/finance/incomes", data, format="json")
        assert response.status_code == 201, response.content
        ids[key] = response.json()["data"]["id"]

    hook("S1", 1001, "2026-03-15 10:20:00", "META PLATFORMS IRELAND THANH TOAN QC", 9200000)
    hook("S2", 1002, "2026-06-30 23:30:00", "FACEBOOK PAYOUT", 4600000)
    response = api.post(
        f"/api/v1/finance/platforms/{facebook.pk}/tax-rates",
        {"effective_from": "2026-07-01", "tax_withheld": True, "rate": "10"},
        format="json",
    )
    assert response.status_code == 201, response.content
    ids["S3_affected"] = response.json()["data"]["affected_income_ids"]
    hook("S4", 1003, "2026-07-01 00:10:00", "FACEBOOK PAYOUT", 9000000)
    hook("S5", 1004, "2026-08-10 09:00:00", "GOOGLE ASIA PACIFIC YOUTUBE", 9500000)
    hook("S6", 1009, "2026-08-10 09:00:00", "GOOGLE ASIA PACIFIC YOUTUBE", 9500000, referenceCode="FT1004")
    hook("S7", 1005, "2026-09-05 14:00:00", "SHOPEE THANH TOAN DON HANG", 3000000)
    hook("S8", 1006, "2026-10-01 12:00:00", "CHUYEN TIEN AN TRUA", 250000)
    hook("S9", 1006, "2026-10-01 12:00:00", "CHUYEN TIEN AN TRUA", 250000)
    hook("S10", 1007, "2026-10-02 12:00:00", "CHUYEN TIEN RA", 1000000, transferType="out")
    hook("S13", 1010, "2026-11-02 08:00:00", "TT TU MT PLTF 0211", 4500000)
    response = api.patch(
        f"/api/v1/finance/incomes/{ids['S13']}", {"platform_id": str(facebook.pk)}, format="json"
    )
    assert response.status_code == 200, response.content
    vnd, usd = str(currency("VND").pk), str(currency("USD").pk)
    freelance_vnd = {"platform_id": str(freelance.pk), "currency_id": vnd}
    manual(
        "S15",
        {
            **freelance_vnd,
            "received_at": "2026-11-20T10:00:00+07:00",
            "original_amount": "15000000",
            "note": "Làm web cho khách A",
        },
    )
    manual(
        "S16",
        {
            "platform_id": str(facebook.pk),
            "currency_id": vnd,
            "received_at": "2026-12-05T10:00:00+07:00",
            "original_amount": "18000000",
        },
    )
    manual(
        "S17",
        {
            "platform_id": str(youtube.pk),
            "currency_id": vnd,
            "received_at": "2026-12-20T10:00:00+07:00",
            "original_amount": "1000000",
        },
    )
    manual(
        "S18",
        {
            "platform_id": str(facebook.pk),
            "currency_id": vnd,
            "received_at": "2026-12-28T10:00:00+07:00",
            "original_amount": "9000000",
            "is_tax_manual": True,
            "tax_withheld": True,
            "tax_rate": "10",
            "tax_amount": "950000",
            "note": "Sao kê FB T12",
        },
    )
    hook("S19", 1008, "2025-12-31 23:50:00", "FACEBOOK PAYOUT", 4600000)
    manual(
        "S20",
        {
            "platform_id": str(upwork.pk),
            "currency_id": usd,
            "received_at": "2026-12-15T10:00:00+07:00",
            "original_amount": "1000.00",
            "rate_source": "API",
        },
    )
    manual(
        "S21",
        {
            "platform_id": str(freelance.pk),
            "currency_id": usd,
            "received_at": "2026-12-26T10:00:00+07:00",
            "original_amount": "500.00",
            "rate_source": "API",
        },
    )
    manual(
        "S22",
        {
            "platform_id": str(freelance.pk),
            "currency_id": usd,
            "received_at": "2026-12-10T10:00:00+07:00",
            "original_amount": "300.00",
            "rate_source": "MANUAL",
            "exchange_rate": "25000",
        },
    )
    hook("S23", 1011, "2026-12-12 09:00:00", "UPWORK ESCROW PAYOUT", 12800000)
    response = api.patch(
        f"/api/v1/finance/incomes/{ids['S23']}",
        {"currency_id": usd, "original_amount": "500.00"},
        format="json",
    )
    assert response.status_code == 200, response.content
    hook("S25", 1012, "2026-12-13 09:00:00", "KHACH CHUYEN", "abc")
    return ids
