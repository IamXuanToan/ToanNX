"""Integration test cho Webhook SePay quyên góp (DonationWebhookView)."""

import pytest
from rest_framework.test import APIClient

from app.system.models.user import User
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath

pytestmark = pytest.mark.django_db


@pytest.fixture
def donate_page(django_user_model: type[User]) -> tuple[Page, str]:
    """Tạo một trang Donate có cấu hình webhook cho mã QR."""
    user = django_user_model.objects.create(email="creator@example.com", is_active=True)
    path, _ = PagePath.objects.get_or_create(segment="p", defaults={"name": "Trang cá nhân", "is_active": True})
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


def test_webhook_ingest_creates_donation(donate_page: tuple[Page, str]) -> None:
    """Webhook SePay gửi đến tạo thành công DonationTransaction."""
    page, token = donate_page
    client = APIClient()

    payload = {
        "id": 998877,
        "gateway": "MBBank",
        "transactionDate": "2026-11-24 14:30:00",
        "accountNumber": "0987654321",
        "transferType": "in",
        "transferAmount": 100000,
        "content": "donate chuc ban vui ve",
    }

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
    response = client.post("/api/v1/utilities/donations/webhook/invalid-token-xyz", data=payload, format="json")
    assert response.status_code == 404
