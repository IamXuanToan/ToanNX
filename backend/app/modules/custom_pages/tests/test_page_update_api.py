"""Kiểm thử endpoint cập nhật trang: PATCH /api/v1/custom_pages/pages/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.permissions.page_permission import PagePermission as P
from app.modules.custom_pages.tests.helpers.page_test_helper import (
    create_qr_image,
    get_seeded_path,
    make_doc,
    make_paragraph,
)
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/custom_pages/pages"


class TestPageUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/custom_pages/pages/{id}."""

    def test_update_content_version_conflict_409(self, user: Any, login: Any) -> None:
        """Cập nhật nội dung có kiểm tra optimistic locking qua content_version; lệch version bị 409."""
        grant(user, P.UPDATE)
        path = get_seeded_path("p")
        page = Page.objects.create(
            owner=user, path=path, title="Trang Version", slug="page-ver", content_version=1
        )
        api = login(user)

        # 1. Cập nhật đúng version=1 -> version tăng lên 2
        payload1 = {"content": make_doc(make_paragraph("Phiên bản 2")), "content_version": 1}
        res1 = api.patch(f"{BASE_URL}/{page.pk}", payload1, format="json")
        data1 = self.assert_success(res1, 200)
        assert data1["content_version"] == 2

        # 2. Gửi lại version cũ=1 -> bị 409 CUSTOM_PAGES_VERSION_CONFLICT
        res2 = api.patch(f"{BASE_URL}/{page.pk}", payload1, format="json")
        self.assert_error(res2, 409, "CUSTOM_PAGES_VERSION_CONFLICT")

    def test_update_content_validation_disallowed_nodes(self, user: Any, login: Any) -> None:
        """Validate cấm các node Tiptap không hợp lệ (script tag hoặc javascript: protocol link)."""
        grant(user, P.UPDATE)
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang Bad Node", slug="bad-node")
        api = login(user)

        # 1. Node script không được hỗ trợ
        bad_node = make_doc({"type": "script", "content": []})
        res1 = api.patch(
            f"{BASE_URL}/{page.pk}", {"content": bad_node, "content_version": 1}, format="json"
        )
        self.assert_error(res1, 400, "VALIDATION_ERROR")

        # 2. Link chứa javascript:alert
        js_link = make_doc(
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Link cấm",
                        "marks": [{"type": "link", "attrs": {"href": "javascript:alert(1)"}}],
                    }
                ],
            }
        )
        res2 = api.patch(
            f"{BASE_URL}/{page.pk}", {"content": js_link, "content_version": 1}, format="json"
        )
        self.assert_error(res2, 400, "VALIDATION_ERROR")

    def test_update_content_image_unowned_attachment_rejected_400(self, user: Any, login: Any) -> None:
        """Chèn ảnh thuộc sở hữu người khác vào content bị 400 VALIDATION_ERROR."""
        grant(user, P.UPDATE)
        other_user = UserFactory()
        foreign_attachment_id = create_qr_image(other_user)

        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang Ảnh", slug="page-img")
        api = login(user)

        foreign_image = make_doc(
            {"type": "image", "attrs": {"attachmentId": foreign_attachment_id, "alt": "x"}}
        )
        res = api.patch(
            f"{BASE_URL}/{page.pk}", {"content": foreign_image, "content_version": 1}, format="json"
        )
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_update_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể sửa trang của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.UPDATE)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Gốc", slug="goc")

        api = login(user)
        res = api.patch(f"{BASE_URL}/{other_page.pk}", {"title": "Hack"}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_update_manage_all_can_update_other_user(self, user: Any, login: Any) -> None:
        """Có quyền MANAGE_ALL thì sửa được trang của người khác."""
        grant(user, P.UPDATE, P.MANAGE_ALL)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Gốc", slug="goc")

        api = login(user)
        res = api.patch(f"{BASE_URL}/{other_page.pk}", {"title": "Admin Sửa"}, format="json")
        data = self.assert_success(res, 200)
        assert data["title"] == "Admin Sửa"

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(f"{BASE_URL}/00000000-0000-0000-0000-000000000000", {}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền custom_pages.page.update bị 403."""
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang", slug="p")
        api = login(user)
        res = api.patch(f"{BASE_URL}/{page.pk}", {"title": "Đổi"}, format="json")
        self.assert_forbidden(res)
