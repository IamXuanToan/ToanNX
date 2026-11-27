"""POST /finance/sepay/webhook/{public_id}: chữ ký, tiền ra, trùng, số tiền lỗi, tiền tệ lạ."""

from typing import Any
from uuid import uuid4

import pytest

from app.finance.models.income import Income
from app.finance.tests.helpers.finance_test_helper import make_connection, make_platform, payload, signed_post
from app.system.models.notification import Notification

pytestmark = pytest.mark.django_db


@pytest.fixture
def connection(superuser: Any) -> Any:
    make_platform(superuser, "facebook", "Facebook", pattern="FACEBOOK")
    return make_connection(superuser)


def test_valid_webhook_creates_income_and_notifies(
    client: Any, connection: Any, django_capture_on_commit_callbacks: Any
) -> None:
    with django_capture_on_commit_callbacks(execute=True):
        response = signed_post(
            client, connection, payload(1, "2026-03-15 10:20:00", "FACEBOOK PAYOUT", 9200000)
        )
    assert response.status_code == 200 and response.json() == {"success": True}
    income = Income.objects.get(sepay_id="1")
    assert (
        income.owner_id == connection.owner_id
        and income.platform.code == "facebook"
        and income.tax_status == "NO_RATE"
    )
    notif = Notification.objects.get(recipient=connection.owner, event_code="finance.income.needs_review")
    assert notif.link == f"/portal/finance/incomes/{income.pk}"


def test_wrong_secret_and_unknown_connection_are_401(client: Any, connection: Any) -> None:
    body = payload(2, "2026-03-15 10:20:00", "X", 1000)
    assert signed_post(client, connection, body, secret="sai").status_code == 401
    assert signed_post(client, connection, body, public_id=uuid4()).status_code == 401
    assert not Income.objects.exists()
    auth_notif = Notification.objects.get(event_code="finance.sepay.webhook_auth_failed")
    assert auth_notif.link == "/portal/finance/sepay"


def test_inactive_connection_is_401(client: Any, connection: Any) -> None:
    connection.is_active = False
    connection.save()
    assert signed_post(client, connection, payload(3, "2026-03-15 10:20:00", "X", 1000)).status_code == 401


def test_out_and_duplicate_are_ignored(client: Any, connection: Any) -> None:
    assert (
        signed_post(
            client, connection, payload(4, "2026-03-15 10:20:00", "X", 1000, transferType="out")
        ).status_code
        == 200
    )
    body = payload(5, "2026-03-15 10:20:00", "X", 1000)
    signed_post(client, connection, body)
    signed_post(client, connection, body)
    signed_post(client, connection, payload(6, "2026-03-15 10:20:00", "X", 1000, referenceCode="FT5"))
    assert Income.objects.count() == 1


@pytest.mark.parametrize("amount", ["abc", 0, -5, None, 12.5])
def test_unreadable_amount_is_stored_as_unknown(client: Any, connection: Any, amount: Any) -> None:
    response = signed_post(client, connection, payload(7, "2026-03-15 10:20:00", "X", amount))
    assert response.status_code == 200
    income = Income.objects.get(sepay_id="7")
    assert (
        income.amount is None
        and income.amount_status == "UNKNOWN"
        and income.tax_status == "PENDING"
        and income.note
    )


def test_unsupported_currency_is_unknown(client: Any, connection: Any) -> None:
    signed_post(client, connection, payload(8, "2026-03-15 10:20:00", "X", 1000, currency="EUR"))
    assert "EUR" in Income.objects.get(sepay_id="8").note


def test_bad_json_is_400(client: Any, connection: Any) -> None:
    from app.finance.tests.helpers import finance_test_helper as helper

    response = signed_post(client, connection, {"transferType": "in"})
    assert response.status_code == 400
    assert helper.WEBHOOK_URL
