"""Kiểm thử gửi góp ý / báo lỗi ẩn danh công khai: POST /api/v1/utilities/public/feedbacks."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.notification import Notification
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.models.page_feedback import PageFeedback
from app.utilities.models.page_path import PagePath
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.page_feedback_permission import PageFeedbackPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/public/feedbacks"


class TestPageFeedbackPublicApi(BaseApiTestCase):
    """Kiểm thử gửi góp ý ẩn danh cho Custom Page & ShortLink, honeypot và thông báo chủ trang."""

    def test_submit_feedback_for_page_and_short_link_notifies_owner(
        self, client: Any, user: Any, staff: Any
    ) -> None:
        """Khách ẩn danh gửi góp ý thành công và bắn thông báo tới đúng chủ sở hữu."""
        grant(user, *P.member())
        grant(staff, *P.member())
        path_obj = PagePath.objects.create(segment="shop", name="Shop")
        page = Page.objects.create(
            owner=user,
            path=path_obj,
            title="Trang Affiliate Demo",
            slug="aff-demo",
            status=Page.Status.PUBLISHED,
        )
        short_link = ShortLink.objects.create(
            owner=staff,
            name="Link Shopee",
            slug="shopee-demo",
            destination_url="https://shopee.vn/item-1",
            status=ShortLink.Status.ACTIVE,
        )

        res_page = self.assert_success(
            client.post(
                URL,
                {
                    "target_type": "PAGE",
                    "target_id": str(page.pk),
                    "target_url": "https://toannx.com/shop/aff-demo",
                    "feedback_type": "BROKEN_LINK",
                    "message": "Link sản phẩm số 2 bị 404 ạ.",
                    "sender_name": "Khách A",
                    "sender_email": "khach@example.com",
                },
                format="json",
            ),
            201,
        )
        assert "target_owner" not in res_page
        assert PageFeedback.objects.filter(pk=res_page["id"], target_owner=user).exists()
        assert Notification.objects.filter(recipient=user, event_code="utilities.feedback.received").exists()

        res_link = self.assert_success(
            client.post(
                URL,
                {
                    "target_type": "SHORT_LINK",
                    "slug": short_link.slug,
                    "target_url": "https://toannx.com/s/shopee-demo",
                    "feedback_type": "WRONG_INFO",
                    "message": "Link hết hạn.",
                },
                format="json",
            ),
            201,
        )
        assert PageFeedback.objects.filter(pk=res_link["id"], target_owner=staff).exists()

        # Honeypot bị chặn
        self.assert_error(
            client.post(
                URL,
                {
                    "target_type": "SHORT_LINK",
                    "slug": short_link.slug,
                    "target_url": "https://toannx.com/s/shopee-demo",
                    "message": "Spam bot",
                    "website": "https://spam.invalid",
                },
                format="json",
            ),
            422,
        )
