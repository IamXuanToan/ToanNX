"""Kiểm thử API Mẫu Email (EmailTemplate): phân quyền SYSTEM/PERSONAL, duplicate, preview & seed."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.email_template import EmailTemplate
from app.system.permissions.email_template_permission import EmailTemplatePermission as P
from app.system.services.email_template_seed_service import EmailTemplateSeedService
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/email-templates"


class TestEmailTemplateApi(BaseApiTestCase):
    """Kiểm thử CRUD, phân quyền 3 tầng, nhân bản và trộn biến chống XSS cho EmailTemplate."""

    def test_seed_defaults_and_member_reads_active_system_plus_personal(
        self, user: Any, staff: Any, login: Any
    ) -> None:
        """Seed tạo đủ mẫu mặc định; thành viên đọc được mẫu SYSTEM ACTIVE và mẫu của mình."""
        EmailTemplateSeedService().seed_defaults()
        assert EmailTemplate.objects.filter(
            code="feedback_thank_you", scope=EmailTemplate.Scope.SYSTEM
        ).exists()

        grant(user, *P.member())
        api = login(user)

        # Tạo mẫu cá nhân cho user và other_user
        res = self.assert_success(
            api.post(
                URL,
                {
                    "code": "my_thanks",
                    "name": "Cảm ơn riêng của tôi",
                    "category": "FEEDBACK_THANKS",
                    "subject": "Cảm ơn {{sender_name}}",
                    "html_body": "<p>Xin chào {{sender_name}}!</p><script>alert(1)</script>",
                },
                format="json",
            ),
            201,
        )
        assert "<script>" not in res["html_body"]
        assert res["scope"] == "PERSONAL"

        EmailTemplate.objects.create(
            code="other_tpl",
            name="Mẫu người khác",
            scope=EmailTemplate.Scope.PERSONAL,
            owner=staff,
            subject="Hi",
        )

        # Danh sách chỉ thấy SYSTEM ACTIVE cho Portal + mẫu PERSONAL của user (ẩn AUTH/NOTIFICATION)
        listed = self.assert_success(api.get(URL))
        codes = {item["code"] for item in listed}
        assert "feedback_thank_you" in codes
        assert "my_thanks" in codes
        assert "email_verification" not in codes
        assert "other_tpl" not in codes

        # Admin có manage_all ở chế độ portal_only=true cũng không thấy mẫu AUTH của Admin
        grant(staff, *P.all())
        api_staff = login(staff)
        portal_listed = self.assert_success(api_staff.get(f"{URL}?portal_only=true"))
        portal_codes = {item["code"] for item in portal_listed}
        assert "feedback_thank_you" in portal_codes
        assert "email_verification" not in portal_codes

        # Không được tạo scope=SYSTEM khi thiếu MANAGE_ALL
        self.assert_error(
            api.post(
                URL,
                {
                    "code": "hack_sys",
                    "name": "Hack",
                    "scope": "SYSTEM",
                    "subject": "Hi",
                },
                format="json",
            ),
            403,
        )

    def test_duplicate_preview_xss_escape_and_bulk_status(self, user: Any, login: Any) -> None:
        """Nhân bản mẫu SYSTEM -> PERSONAL, trộn biến escape HTML và đổi trạng thái hàng loạt."""
        EmailTemplateSeedService().seed_defaults()
        sys_tpl = EmailTemplate.objects.get(
            code="feedback_thank_you", locale="vi", scope=EmailTemplate.Scope.SYSTEM
        )

        grant(user, *P.member())
        api = login(user)

        # Member không sửa/xóa trực tiếp được mẫu SYSTEM
        self.assert_error(api.patch(f"{URL}/{sys_tpl.pk}", {"name": "Sửa lén"}, format="json"), 403)
        self.assert_error(api.delete(f"{URL}/{sys_tpl.pk}"), 403)

        # Nhân bản thành mẫu PERSONAL
        dup = self.assert_success(api.post(f"{URL}/{sys_tpl.pk}/duplicate", {}, format="json"), 201)
        assert dup["scope"] == "PERSONAL"
        assert dup["code"].startswith("feedback_thank_you_copy")

        # Preview tự động escape HTML trong biến đầu vào chống XSS
        preview = self.assert_success(
            api.post(
                f"{URL}/{dup['id']}/preview",
                {
                    "sample_data": {
                        "sender_name": '<img src=x onerror="alert(1)">',
                        "target_title": "Trang Demo",
                        "target_url": "https://toannx.com/p/demo",
                        "feedback_type": "Sai link",
                        "resolution_note": "Đã sửa",
                        "owner_name": "Toàn",
                    }
                },
                format="json",
            )
        )
        assert "<img" not in preview["html_body"]
        assert "&lt;img src=x" in preview["html_body"]

        # Bulk update status
        self.assert_success(
            api.post(
                f"{URL}/bulk-update",
                {"ids": [dup["id"]], "status": "ARCHIVED"},
                format="json",
            )
        )
        assert EmailTemplate.objects.get(pk=dup["id"]).status == EmailTemplate.Status.ARCHIVED
