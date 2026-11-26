"""Kiểm thử endpoint công khai feed quyên góp: GET /api/v1/utilities/pages/<id>/donations/feed."""

import time
import uuid
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


def _feed_url(page_id: uuid.UUID | str) -> str:
    return f"/api/v1/utilities/pages/{page_id}/donations/feed"


class TestDonationPublicFeedApi(BaseApiTestCase):
    """Kiểm thử phân trang, ẩn bình luận, che số tiền và validate query cho feed Donate công khai."""

    def test_public_feed_returns_visible_items_with_pagination_and_hidden_amount(self, client: Any) -> None:
        owner = UserFactory()
        path = get_seeded_path("p")
        page = Page.objects.create(
            owner=owner,
            path=path,
            title="Donate Page",
            slug="donate-feed-test",
            page_type=Page.PageType.DONATION,
            status=Page.Status.PUBLISHED,
            content_config={"qrCodes": [{"id": "qr-1", "hideAmount": True, "webhookEnabled": True}]},
        )
        now = timezone.now()
        DonationTransaction.objects.create(
            page=page,
            owner=owner,
            qr_item_id="qr-1",
            donor_title="Bạn tốt 1",
            amount=100000,
            message="Ủng hộ 1",
            received_at=now,
            sepay_id="FEED-1",
        )
        DonationTransaction.objects.create(
            page=page,
            owner=owner,
            qr_item_id="qr-1",
            donor_title="Bạn tốt 2",
            amount=200000,
            message="Ủng hộ 2",
            received_at=now,
            sepay_id="FEED-2",
            is_hidden=True,
        )

        res = client.get(_feed_url(page.pk), {"limit": 10, "page": 1})
        data = self.assert_success(res)
        assert len(data) == 1
        assert data[0]["donor_title"] == "Bạn tốt 1"
        assert data[0]["hide_amount"] is True
        assert data[0]["amount"] is None

    def test_unpublished_or_missing_page_returns_empty_list(self, client: Any) -> None:
        owner = UserFactory()
        draft = Page.objects.create(
            owner=owner,
            path=get_seeded_path("p"),
            title="Draft Donate",
            slug="donate-draft-feed",
            page_type=Page.PageType.DONATION,
            status=Page.Status.DRAFT,
        )
        assert self.assert_success(client.get(_feed_url(draft.pk))) == []
        assert self.assert_success(client.get(_feed_url(uuid.uuid4()))) == []

    def test_invalid_pagination_query_returns_400_instead_of_500(self, client: Any) -> None:
        self.assert_error(client.get(_feed_url(uuid.uuid4()), {"limit": "abc"}), 400, "VALIDATION_ERROR")
        self.assert_error(client.get(_feed_url(uuid.uuid4()), {"page": "xyz"}), 400, "VALIDATION_ERROR")

    def test_feed_cache_hit_0_db_and_invalidation_on_webhook_moderation_delete_and_page_update(
        self,
        client: Any,
        fake_redis: FakeRedis,
        django_assert_num_queries: Any,
        django_capture_on_commit_callbacks: Any,
    ) -> None:
        """Feed cache TTL 600s theo page_id+page+limit, hit=0 SQL, invalidate on_commit ở mọi nhánh ghi."""
        owner = UserFactory()
        token = "feed-cache-webhook-tok"
        page = Page.objects.create(
            owner=owner,
            path=get_seeded_path("p"),
            title="Donate Cache Page",
            slug="donate-cache-feed",
            page_type=Page.PageType.DONATION,
            status=Page.Status.PUBLISHED,
            content_config={
                "qrCodes": [
                    {
                        "id": "qr-1",
                        "type": "BANK_TRANSFER",
                        "webhookEnabled": True,
                        "webhookToken": token,
                    }
                ]
            },
        )
        now = timezone.now()
        tx1 = DonationTransaction.objects.create(
            page=page,
            owner=owner,
            qr_item_id="qr-1",
            donor_title="Người 1",
            amount=50000,
            message="Tin 1",
            received_at=now,
            sepay_id="CF-1",
        )

        # Miss trang 1 limit 10 -> lưu cache TTL 600s
        data1 = self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 1}))
        assert len(data1) == 1
        feed_key = next(k for k in fake_redis.expires if f"donation_feed:{page.pk}" in k)
        ttl = fake_redis.expires[feed_key] - time.monotonic()
        assert PUBLIC_CACHE_TTL_SECONDS - 10 <= ttl <= PUBLIC_CACHE_TTL_SECONDS + 1

        # Hit trang 1 limit 10 -> 0 SQL query
        with django_assert_num_queries(0):
            assert self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 1})) == data1

        # Tham số page/limit khác tạo cache key riêng
        assert self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 2})) == []

        # 1. Webhook SePay mới -> on_commit invalidate
        with django_capture_on_commit_callbacks(execute=True):
            wh = client.post(
                f"/api/v1/utilities/donations/webhook/{token}",
                data={"id": 555001, "transferType": "in", "transferAmount": 120000, "content": "donate moi"},
                format="json",
            )
            assert wh.status_code == 200
        assert len(self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 1}))) == 2

        # 2. Kiểm duyệt ẩn bình luận (toggle_hidden) -> invalidate
        with django_capture_on_commit_callbacks(execute=True):
            DonationTransactionService().toggle_hidden(owner, tx1.pk, True)
        after_hide = self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 1}))
        assert len(after_hide) == 1

        # 3. Đổi cấu hình Page (ẩn số tiền) -> invalidate
        with django_capture_on_commit_callbacks(execute=True):
            PageService().update(
                owner, page.pk, {"content_config": {**page.content_config, "hideAmount": True}}
            )
        after_page = self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 1}))
        assert after_page[0]["amount"] is None

        # 4. Bulk delete -> invalidate
        tx2 = DonationTransaction.objects.get(sepay_id="555001")
        with django_capture_on_commit_callbacks(execute=True):
            DonationTransactionService().bulk_delete(owner, [tx2.pk])
        assert self.assert_success(client.get(_feed_url(page.pk), {"limit": 10, "page": 1})) == []

    def test_feed_falls_back_to_db_when_redis_errors(self, client: Any, fake_redis: FakeRedis) -> None:
        owner = UserFactory()
        page = Page.objects.create(
            owner=owner,
            path=get_seeded_path("p"),
            title="Donate Fallback",
            slug="donate-fallback-feed",
            page_type=Page.PageType.DONATION,
            status=Page.Status.PUBLISHED,
        )
        DonationTransaction.objects.create(
            page=page,
            owner=owner,
            donor_title="Khách quý",
            amount=50000,
            message="OK",
            received_at=timezone.now(),
            sepay_id="FB-1",
        )
        fake_redis.fail = True
        data = self.assert_success(client.get(_feed_url(page.pk)))
        assert len(data) == 1
