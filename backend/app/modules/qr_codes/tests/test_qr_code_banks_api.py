"""Kiểm thử endpoint danh sách ngân hàng: GET /api/v1/qr_codes/banks."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/qr_codes/banks"


class TestQrCodeBanksApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/qr_codes/banks."""

    def test_banks_list_success(self, user: Any, login: Any) -> None:
        """Người dùng đăng nhập lấy được danh sách ngân hàng hỗ trợ VietQR."""
        api = login(user)
        res = api.get(URL)
        banks = self.assert_success(res, 200)

        assert isinstance(banks, list)
        assert len(banks) > 0
        assert any(bank["bin"] == "970436" for bank in banks)

    def test_banks_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)
