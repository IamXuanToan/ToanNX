"""Kiểm thử endpoint danh sách mã QR: GET /api/v1/utilities/qr-codes."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.tests.helpers.qr_test_helper import create_test_qr

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/qr-codes"


class TestQrCodeListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/qr-codes."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách mã QR có phân trang."""
        grant(user, P.READ)
        for i in range(3):
            create_test_qr(user, name=f"QR {i}")

        api = login(user)
        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3
        assert pagination["page"] == 1
        assert pagination["page_size"] == 2

    def test_list_filter_qr_type(self, user: Any, login: Any) -> None:
        """Lọc mã QR theo qr_type."""
        grant(user, P.READ)
        create_test_qr(user, name="QR Text", qr_type="TEXT")
        create_test_qr(user, name="QR URL", qr_type="URL", content={"url": "https://example.com"})

        api = login(user)
        items, _ = self.assert_paginated(api.get(URL, {"qr_type": "TEXT", "page": 1}))
        assert len(items) == 1
        assert items[0]["name"] == "QR Text"

    def test_list_search_by_name(self, user: Any, login: Any) -> None:
        """Tìm kiếm mã QR theo tên."""
        grant(user, P.READ)
        create_test_qr(user, name="Mã Thanh Toán")
        create_test_qr(user, name="Mã Wifi")

        api = login(user)
        items, _ = self.assert_paginated(api.get(URL, {"search": "Thanh Toán", "page": 1}))
        assert len(items) == 1
        assert items[0]["name"] == "Mã Thanh Toán"

    def test_list_ordering(self, user: Any, login: Any) -> None:
        """Sắp xếp mã QR theo tên."""
        grant(user, P.READ)
        create_test_qr(user, name="B-QR")
        create_test_qr(user, name="A-QR")

        api = login(user)
        items, _ = self.assert_paginated(api.get(URL, {"ordering": "name", "page": 1}))
        assert items[0]["name"] == "A-QR"
        assert items[1]["name"] == "B-QR"

    def test_list_owner_isolation_and_manage_all(self, user: Any, login: Any) -> None:
        """User thường chỉ thấy QR của mình; có MANAGE_ALL thấy toàn bộ."""
        other_user = UserFactory()
        create_test_qr(user, name="QR Của Tôi")
        create_test_qr(other_user, name="QR Người Khác")

        # 1. Chỉ có READ: thấy 1 QR của mình
        grant(user, P.READ)
        api = login(user)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination["total"] == 1
        assert items[0]["name"] == "QR Của Tôi"

        # 2. Có MANAGE_ALL: thấy cả 2 QRs
        grant(user, P.MANAGE_ALL)
        api_managed = login(user)
        items_all, pagination_all = self.assert_paginated(api_managed.get(URL, {"page": 1}))
        assert pagination_all["total"] == 2

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.qr_code.read bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)

    def test_list_response_envelope(self, user: Any, login: Any) -> None:
        """Kiểm tra cấu trúc envelope chuẩn."""
        grant(user, P.READ)
        api = login(user)

        res = api.get(URL, {"page": 1})
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert "request_id" in body["meta"]
        assert "pagination" in body["meta"]
        assert isinstance(body["data"], list)
