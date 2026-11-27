"""Kiểm thử bảng vinh danh quyên góp công khai: GET /utilities/pages/<id>/donations/leaderboard."""

import time
import uuid
from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.tests.factories.user_factory import UserFactory
from app.utilities.constants.public_cache import PUBLIC_CACHE_TTL_SECONDS
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.utilities.services.donation_transaction_service import DonationTransactionService
from app.utilities.services.page_service import PageService
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db


def _leaderboard_url(page_id: uuid.UUID | str) -> str:
    return f"/api/v1/utilities/pages/{page_id}/donations/leaderboard"


class TestDonationPublicLeaderboardApi(BaseApiTestCase):
    """Kiểm thử Bảng Vinh danh công khai, cache Redis TTL 600s, 0 DB query khi hit và invalidation."""

    def test_leaderboard_cache_hit_0_db_and_invalidation(
        self,
        client: Any,
        fake_redis: FakeRedis,
        django_assert_num_queries: Any,
        django_capture_on_commit_callbacks: Any,
    ) -> None:
        owner = UserFactory()
        token = "lb-cache-webhook-tok"
        page = Page.objects.create(
            owner=owner,
            path=get_seeded_path("p"),
            title="Donate LB",
            slug="donate-lb-cache",
            page_type=Page.PageType.DONATION,
            status=Page.Status.PUBLISHED,
            content_config={
                "leaderboardDays": 7,
                "qrCodes": [
                    {
                        "id": "qr-1",
                        "type": "BANK_TRANSFER",
                        "webhookEnabled": True,
                        "webhookToken": token,
                    }
                ],
            },
        )
        now = timezone.now()
        # Hạng GOLD còn hiệu lực
        gold = DonationTransaction.objects.create(
            page=page,
            owner=owner,
            qr_item_id="qr-1",
            donor_title="Mạnh thường quân Vàng",
            amount=500000,
            tier=DonationTransaction.Tier.GOLD,
            tier_expires_at=now + timedelta(days=5),
            message="Ủng hộ dự án",
            received_at=now,
            sepay_id="LB-1",
        )
        # NORMAL không vào bảng vinh danh
        DonationTransaction.objects.create(
            page=page,
            owner=owner,
            qr_item_id="qr-1",
            donor_title="Người thường",
            amount=20000,
            tier=DonationTransaction.Tier.NORMAL,
            message="ly cf",
            received_at=now,
            sepay_id="LB-2",
        )

        res1 = self.assert_success(client.get(_leaderboard_url(page.pk)))
        assert len(res1) == 1
        assert res1[0]["donor_title"] == "Mạnh thường quân Vàng"
        lb_key = next(k for k in fake_redis.expires if f"donation_leaderboard:{page.pk}" in k)
        ttl = fake_redis.expires[lb_key] - time.monotonic()
        assert PUBLIC_CACHE_TTL_SECONDS - 10 <= ttl <= PUBLIC_CACHE_TTL_SECONDS + 1

        # Cache hit -> 0 DB query
        with django_assert_num_queries(0):
            assert self.assert_success(client.get(_leaderboard_url(page.pk))) == res1

        # Webhook nhận giao dịch DIAMOND mới -> on_commit invalidate
        with django_capture_on_commit_callbacks(execute=True):
            wh = client.post(
                f"/api/v1/utilities/donations/webhook/{token}",
                data={"id": 888001, "transferType": "in", "transferAmount": 1200000, "content": "donate vip"},
                format="json",
            )
            assert wh.status_code == 200
        res2 = self.assert_success(client.get(_leaderboard_url(page.pk)))
        assert len(res2) == 2
        assert res2[0]["tier"] == DonationTransaction.Tier.DIAMOND

        # Cập nhật is_hidden / delete -> invalidate
        with django_capture_on_commit_callbacks(execute=True):
            DonationTransactionService().update(owner, gold.pk, {"is_hidden": True})
        res3 = self.assert_success(client.get(_leaderboard_url(page.pk)))
        assert len(res3) == 1

        # Cập nhật Page xóa/ẩn -> invalidate
        with django_capture_on_commit_callbacks(execute=True):
            PageService().delete(owner, page.pk)
        assert self.assert_success(client.get(_leaderboard_url(page.pk))) == []

    def test_leaderboard_falls_back_when_redis_unavailable(self, client: Any, fake_redis: FakeRedis) -> None:
        owner = UserFactory()
        page = Page.objects.create(
            owner=owner,
            path=get_seeded_path("p"),
            title="LB Fallback",
            slug="lb-fallback",
            page_type=Page.PageType.DONATION,
            status=Page.Status.PUBLISHED,
        )
        DonationTransaction.objects.create(
            page=page,
            owner=owner,
            donor_title="Bạc",
            amount=250000,
            tier=DonationTransaction.Tier.SILVER,
            tier_expires_at=timezone.now() + timedelta(days=2),
            received_at=timezone.now(),
            sepay_id="LB-FB",
        )
        fake_redis.fail = True
        data = self.assert_success(client.get(_leaderboard_url(page.pk)))
        assert len(data) == 1
