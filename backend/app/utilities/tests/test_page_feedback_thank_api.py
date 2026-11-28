"""Kiểm thử gửi email cảm ơn người góp ý: POST /api/v1/utilities/page-feedbacks/{id}/thank."""

from typing import Any

import pytest
from django.core import mail

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.services.email_template_seed_service import EmailTemplateSeedService
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page_feedback import PageFeedback
from app.utilities.permissions.page_feedback_permission import PageFeedbackPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/page-feedbacks"


class TestPageFeedbackThankApi(BaseApiTestCase):
    """Kiểm thử nút Cảm ơn dùng template mặc định/cá nhân, escape HTML XSS và chặn thiếu email."""

    def test_thank_sender_uses_template_escapes_xss_and_blocks_missing_email(
        self, user: Any, staff: Any, login: Any
    ) -> None:
        """Gửi email cảm ơn thành công qua mẫu mặc định, escape HTML và chặn khi thiếu email."""
        EmailTemplateSeedService().seed_defaults()
        grant(user, *P.member())
        api = login(user)

        fb_with_email = PageFeedback.objects.create(
            target_type=PageFeedback.TargetType.PAGE,
            target_owner=user,
            target_url="https://toannx.com/p/demo",
            target_title="Trang Demo",
            feedback_type=PageFeedback.FeedbackType.BROKEN_LINK,
            message="Sai link",
            sender_name="<script>alert(1)</script>An",
            sender_email="sender@example.com",
        )
        fb_no_email = PageFeedback.objects.create(
            target_type=PageFeedback.TargetType.PAGE,
            target_owner=user,
            target_url="https://toannx.com/p/demo",
            target_title="Trang Demo",
            message="Góp ý ẩn danh không email",
        )
        fb_other = PageFeedback.objects.create(
            target_type=PageFeedback.TargetType.PAGE,
            target_owner=staff,
            target_url="https://toannx.com/p/other",
            sender_email="other@example.com",
            message="Của người khác",
        )

        # Thiếu email -> 422
        self.assert_error(api.post(f"{URL}/{fb_no_email.pk}/thank", {}, format="json"), 422)
        # Của người khác -> 404
        self.assert_error(api.post(f"{URL}/{fb_other.pk}/thank", {}, format="json"), 404)

        mail.outbox.clear()
        res = self.assert_success(
            api.post(
                f"{URL}/{fb_with_email.pk}/thank",
                {"resolution_note": "Đã sửa lại đúng link Shopee."},
                format="json",
            )
        )
        assert res["sent"] is True
        assert res["recipient"] == "sender@example.com"
        assert len(mail.outbox) == 1
        sent_msg = mail.outbox[0]
        assert "Trang Demo" in sent_msg.subject
        html_alt = str(sent_msg.alternatives[0][0])  # type: ignore[attr-defined]
        assert "<script>" not in html_alt
        assert "&lt;script&gt;" in html_alt

        fb_with_email.refresh_from_db()
        assert fb_with_email.status == PageFeedback.Status.RESOLVED
        assert fb_with_email.thanked_at is not None
