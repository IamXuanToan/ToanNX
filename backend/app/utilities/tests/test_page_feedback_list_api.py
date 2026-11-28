"""Kiểm thử danh sách, lọc theo user và xử lý PageFeedback: GET/PATCH /api/v1/utilities/page-feedbacks."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page_feedback import PageFeedback
from app.utilities.permissions.page_feedback_permission import PageFeedbackPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/page-feedbacks"


class TestPageFeedbackListApi(BaseApiTestCase):
    """Kiểm thử owner_isolation (Client), manage_all + filter owner (Admin) và đổi trạng thái."""

    def test_client_sees_only_own_and_admin_filters_by_owner(self, user: Any, staff: Any, login: Any) -> None:
        """Client chỉ thấy góp ý của mình; Admin có `manage_all` thấy tất cả và lọc theo `?owner=`."""
        fb_user = PageFeedback.objects.create(
            target_type=PageFeedback.TargetType.SHORT_LINK,
            target_owner=user,
            target_url="https://toannx.com/s/u1",
            target_title="Link User",
            feedback_type=PageFeedback.FeedbackType.BROKEN_LINK,
            message="Lỗi link 1",
        )
        fb_staff = PageFeedback.objects.create(
            target_type=PageFeedback.TargetType.PAGE,
            target_owner=staff,
            target_url="https://toannx.com/p/s1",
            target_title="Trang Staff",
            feedback_type=PageFeedback.FeedbackType.BUG,
            message="Lỗi giao diện",
        )

        grant(user, *P.member())
        api_user = login(user)

        # Client thiếu manage_all: truyền ?owner=<staff> vẫn chỉ thấy của chính mình
        own_list = self.assert_success(api_user.get(f"{URL}?owner={staff.pk}"))
        assert [row["id"] for row in own_list] == [str(fb_user.pk)]
        self.assert_error(api_user.get(f"{URL}/{fb_staff.pk}"), 404)

        # Client cập nhật trạng thái -> RESOLVED
        updated = self.assert_success(
            api_user.patch(
                f"{URL}/{fb_user.pk}",
                {"status": "RESOLVED", "resolution_note": "Đã cập nhật link mới."},
                format="json",
            )
        )
        assert updated["status"] == "RESOLVED"
        assert updated["resolved_at"] is not None

        # Admin có MANAGE_ALL: thấy tất cả và lọc đúng theo ?owner=<staff>
        grant(staff, P.READ, P.MANAGE_ALL)
        api_admin = login(staff)
        all_rows = self.assert_success(api_admin.get(URL))
        assert {row["id"] for row in all_rows} >= {str(fb_user.pk), str(fb_staff.pk)}

        filtered_rows = self.assert_success(api_admin.get(f"{URL}?owner={user.pk}"))
        assert [row["id"] for row in filtered_rows] == [str(fb_user.pk)]
