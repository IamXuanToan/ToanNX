"""Kiểm thử endpoint tạo đường dẫn giữa: POST /api/v1/utilities/page-paths."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.page_path_permission import PagePathPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/page-paths"


class TestPagePathCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/page-paths."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo đường dẫn giữa thành công (segment tự chuẩn hóa chữ thường)."""
        grant(user, P.PATH_CREATE)
        api = login(user)

        payload = {"segment": "Events", "name": "Sự kiện", "description": "Đường dẫn sự kiện"}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["segment"] == "events"
        assert data["name"] == "Sự kiện"
        assert data["page_count"] == 0

    def test_create_validation_reserved_segments(self, user: Any, login: Any) -> None:
        """Validate cấm các segment hệ thống (admin, s, api...)."""
        grant(user, P.PATH_CREATE)
        api = login(user)

        for reserved in ["admin", "s", "api"]:
            res = api.post(URL, {"segment": reserved, "name": "Trùng"}, format="json")
            self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_create_duplicate_segment_conflict(self, user: Any, login: Any) -> None:
        """Tạo segment trùng nhau bị 409 CONFLICT."""
        grant(user, P.PATH_CREATE)
        api = login(user)

        # Trùng segment "qr" đã seed
        res = api.post(URL, {"segment": "qr", "name": "Mã QR mới"}, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu segment hoặc name."""
        grant(user, P.PATH_CREATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "segment" in error["details"]
        assert "name" in error["details"]

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"segment": "blog", "name": "Blog"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page_path.create bị 403."""
        api = login(user)
        res = api.post(URL, {"segment": "blog", "name": "Blog"}, format="json")
        self.assert_forbidden(res)
