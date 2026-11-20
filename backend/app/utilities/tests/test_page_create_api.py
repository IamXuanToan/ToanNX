"""Kiểm thử endpoint tạo trang: POST /api/v1/utilities/pages."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/pages"


class TestPageCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/pages."""

    def test_create_success_with_template(self, user: Any, login: Any) -> None:
        """Tạo trang thành công kèm template tạo sẵn (ví dụ template 'donate')."""
        grant(user, P.CREATE)
        qr_path = get_seeded_path("qr")
        api = login(user)

        payload = {
            "path_id": str(qr_path.pk),
            "title": "Ủng hộ dự án",
            "slug": "donate",
            "template": "donate",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["title"] == "Ủng hộ dự án"
        assert data["slug"] == "donate"
        assert data["public_url"] == "http://testserver/qr/donate"
        assert data["content"]["content"][0]["type"] == "heading"
        assert data["content_version"] == 1
        assert data["owner"]["id"] == str(user.pk)

    def test_create_success_min_data(self, user: Any, login: Any) -> None:
        """Tạo trang thành công với dữ liệu tối thiểu (tự sinh slug)."""
        grant(user, P.CREATE)
        p_path = get_seeded_path("p")
        api = login(user)

        payload = {
            "path_id": str(p_path.pk),
            "title": "Trang Tối Thiểu",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["title"] == "Trang Tối Thiểu"
        assert len(data["slug"]) > 0
        assert data["status"] == "DRAFT"

    def test_create_duplicate_slug_same_path_conflict(self, user: Any, login: Any) -> None:
        """Trùng slug trên cùng 1 đường dẫn giữa bị 409 CONFLICT."""
        grant(user, P.CREATE)
        qr_path = get_seeded_path("qr")
        api = login(user)

        api.post(URL, {"path_id": str(qr_path.pk), "title": "A", "slug": "trung-slug"}, format="json")
        res2 = api.post(URL, {"path_id": str(qr_path.pk), "title": "B", "slug": "TRUNG-SLUG"}, format="json")
        self.assert_error(res2, 409, "CONFLICT")

    def test_create_same_slug_different_paths_allowed(self, user: Any, login: Any) -> None:
        """Cùng slug nhưng khác đường dẫn giữa thì hoàn toàn hợp lệ."""
        grant(user, P.CREATE)
        qr_path = get_seeded_path("qr")
        p_path = get_seeded_path("p")
        api = login(user)

        self.assert_success(
            api.post(URL, {"path_id": str(qr_path.pk), "title": "A", "slug": "chung-slug"}, format="json"),
            201,
        )
        self.assert_success(
            api.post(URL, {"path_id": str(p_path.pk), "title": "B", "slug": "chung-slug"}, format="json"), 201
        )

    def test_create_on_inactive_path_rejected_422(self, user: Any, login: Any) -> None:
        """Tạo trang trên đường dẫn giữa đã tạm tắt (is_active=False) bị 422 UTILITIES_PAGE_PATH_INACTIVE."""
        grant(user, P.CREATE)
        qr_path = get_seeded_path("qr")
        PagePath.objects.filter(pk=qr_path.pk).update(is_active=False)

        api = login(user)
        res = api.post(URL, {"path_id": str(qr_path.pk), "title": "Trang Mới"}, format="json")
        self.assert_error(res, 422, "UTILITIES_PAGE_PATH_INACTIVE")

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu path_id hoặc title."""
        grant(user, P.CREATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "path_id" in error["details"]
        assert "title" in error["details"]

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"title": "X"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page.create bị 403."""
        api = login(user)
        res = api.post(URL, {"title": "X"}, format="json")
        self.assert_forbidden(res)
