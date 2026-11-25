"""Kiểm thử endpoint công khai feed quyên góp: GET /api/v1/utilities/pages/<id>/donations/feed."""

import uuid
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
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
