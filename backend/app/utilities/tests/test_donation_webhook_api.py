"""Integration test cho Webhook SePay quyên góp (DonationWebhookView)."""

from typing import Any

import pytest
from rest_framework.test import APIClient

from app.finance.models.income import Income
from app.finance.permissions.income_permission import IncomePermission
from app.system.models.notification import Notification
from app.system.models.user import User
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath

pytestmark = pytest.mark.django_db


@pytest.fixture
def donate_page(django_user_model: type[User]) -> tuple[Page, str]:
    """Tạo một trang Donate có cấu hình webhook cho mã QR."""
    user = django_user_model.objects.create(email="creator@example.com", is_active=True)
    grant(user, IncomePermission.READ)
    path, _ = PagePath.objects.get_or_create(
        segment="p", defaults={"name": "Trang cá nhân", "is_active": True}
    )
    token = "qr-webhook-token-test-123"
    page = Page.objects.create(
        owner=user,
        path=path,
        title="Trang ủng hộ của tôi",
        slug="donate",
        page_type=Page.PageType.DONATION,
        status=Page.Status.PUBLISHED,
        content_config={
            "leaderboardDays": 7,
            "qrCodes": [
                {
                    "id": "qr-main-mb",
                    "type": "BANK_TRANSFER",
                    "bankName": "MBBank",
                    "accountNumber": "0987654321",
                    "accountHolder": "NGUYEN VAN A",
                    "webhookEnabled": True,
                    "webhookToken": token,
                }
            ],
        },
    )
    return page, token


def test_webhook_ingest_creates_donation(
    donate_page: tuple[Page, str], django_capture_on_commit_callbacks: Any
) -> None:
    """Webhook SePay gửi đến tạo DonationTransaction, đồng bộ Thu nhập (Donate) và phát thông báo Client."""
    page, token = donate_page
    client = APIClient()

    payload = {
        "id": 998877,
        "gateway": "MBBank",
        "transactionDate": "2026-11-24 14:30:00",
        "accountNumber": "0987654321",
        "referenceCode": "FT-DON-1",
        "transferType": "in",
        "transferAmount": 100000,
        "content": "donate chuc ban vui ve",
    }

    with django_capture_on_commit_callbacks(execute=True):
        response = client.post(
            f"/api/v1/utilities/donations/webhook/{token}",
            data=payload,
            format="json",
        )

    assert response.status_code == 200
    assert response.json() == {"success": True}

    # Kiểm tra bản ghi trong DB
    donation = DonationTransaction.objects.get(sepay_id="998877")
    assert donation.page == page
    assert donation.owner == page.owner
    assert donation.amount == 100000
    assert donation.tier == DonationTransaction.Tier.BRONZE
    assert donation.tier_expires_at is not None
    assert not donation.is_censored
    assert donation.message == "chuc ban vui ve"

    # Kiểm tra tự động đồng bộ sang Thu nhập Tài chính (nền tảng Donate) & thông báo Client
    income = Income.objects.get(owner=page.owner, sepay_id="998877")
    assert income.platform is not None
    assert income.platform.code == "donate"
    assert income.platform.name == "Donate"
    assert income.platform.color == "#DB2777"
    assert income.amount == 100000
    assert income.tax_status == Income.TaxStatus.NOT_WITHHELD
    assert income.bank_name == "MBBank"
    assert income.account_last4 == "4321"
    assert income.reference_code == "FT-DON-1"
    notif = Notification.objects.get(recipient=page.owner, event_code="finance.income.received")
    assert notif.link == f"/portal/finance/incomes/{income.pk}"


def test_webhook_censors_bad_words(donate_page: tuple[Page, str]) -> None:
    """Webhook chứa từ ngữ tục tĩu / khủng bố bị tự động đánh dấu kiểm duyệt."""
    _, token = donate_page
    client = APIClient()

    payload = {
        "id": 998878,
        "gateway": "MBBank",
        "transactionDate": "2026-11-24 14:35:00",
        "accountNumber": "0987654321",
        "transferType": "in",
        "transferAmount": 50000,
        "content": "dkm đồ ngu",
    }

    response = client.post(
        f"/api/v1/utilities/donations/webhook/{token}",
        data=payload,
        format="json",
    )

    assert response.status_code == 200

    donation = DonationTransaction.objects.get(sepay_id="998878")
    assert donation.is_censored
    assert donation.message == ""


def test_webhook_duplicate_id_is_idempotent(donate_page: tuple[Page, str]) -> None:
    """Webhook gửi lại cùng một id giao dịch thì không tạo trùng."""
    _, token = donate_page
    client = APIClient()

    payload = {
        "id": 998879,
        "gateway": "MBBank",
        "transactionDate": "2026-11-24 14:40:00",
        "accountNumber": "0987654321",
        "transferType": "in",
        "transferAmount": 30000,
        "content": "donate 1 ly cf",
    }

    res1 = client.post(f"/api/v1/utilities/donations/webhook/{token}", data=payload, format="json")
    assert res1.status_code == 200

    res2 = client.post(f"/api/v1/utilities/donations/webhook/{token}", data=payload, format="json")
    assert res2.status_code == 200

    assert DonationTransaction.objects.filter(sepay_id="998879").count() == 1


def test_webhook_invalid_token_returns_404() -> None:
    """Token không tồn tại trả 404."""
    client = APIClient()
    payload = {"id": 111, "transferAmount": 50000}
    response = client.post(
        "/api/v1/utilities/donations/webhook/invalid-token-xyz", data=payload, format="json"
    )
    assert response.status_code == 404


def test_webhook_rejects_outgoing_transfer_type(donate_page: tuple[Page, str]) -> None:
    """Không ghi nhận giao dịch tiền ra (transferType != 'in')."""
    _, token = donate_page
    client = APIClient()
    payload = {
        "id": 998880,
        "transferType": "out",
        "transferAmount": 100000,
        "content": "rut tien",
    }
    response = client.post(f"/api/v1/utilities/donations/webhook/{token}", data=payload, format="json")
    assert response.status_code == 400
    assert not DonationTransaction.objects.filter(sepay_id="998880").exists()


def test_webhook_rejects_non_positive_amount(donate_page: tuple[Page, str]) -> None:
    """Số tiền âm hoặc bằng 0 bị từ chối 400 để tránh làm sai lệch quyên góp và thu nhập."""
    _, token = donate_page
    client = APIClient()
    for bad_amount in (0, -100000):
        response = client.post(
            f"/api/v1/utilities/donations/webhook/{token}",
            data={"id": f"bad-{bad_amount}", "transferType": "in", "transferAmount": bad_amount},
            format="json",
        )
        assert response.status_code == 400
        assert not DonationTransaction.objects.filter(sepay_id=f"bad-{bad_amount}").exists()


def test_webhook_rejects_cross_page_sepay_id_reuse(
    django_user_model: type[User], donate_page: tuple[Page, str]
) -> None:
    """Không cho phép dùng lại sepay_id đã ghi nhận ở trang khác để giả mạo phản hồi 200."""
    _, victim_token = donate_page
    attacker = django_user_model.objects.create(email="attacker-donate@example.com", is_active=True)
    path = PagePath.objects.get(segment="p")
    attacker_token = "attacker-secret-token-456"
    Page.objects.create(
        owner=attacker,
        path=path,
        title="Trang Attacker",
        slug="attacker-donate",
        page_type=Page.PageType.DONATION,
        status=Page.Status.PUBLISHED,
        content_config={
            "qrCodes": [
                {
                    "id": "qr-att",
                    "type": "BANK_TRANSFER",
                    "webhookEnabled": True,
                    "webhookToken": attacker_token,
                }
            ]
        },
    )
    client = APIClient()
    assert (
        client.post(
            f"/api/v1/utilities/donations/webhook/{attacker_token}",
            data={"id": 777666, "transferType": "in", "transferAmount": 50000},
            format="json",
        ).status_code
        == 200
    )
    replay = client.post(
        f"/api/v1/utilities/donations/webhook/{victim_token}",
        data={"id": 777666, "transferType": "in", "transferAmount": 50000},
        format="json",
    )
    assert replay.status_code == 400
