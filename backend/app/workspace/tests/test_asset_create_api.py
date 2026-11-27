"""Kiểm thử tạo mới Thiết bị: POST /api/v1/workspace/assets."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.models.exchange_rate import ExchangeRate
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.helpers.permission_helper import grant
from app.workspace.permissions.asset_permission import AssetPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assets"


class TestAssetCreateApi(BaseApiTestCase):
    """Kiểm thử đầy đủ dữ liệu, tối thiểu, ngoại tệ thiếu tỷ giá, `add_months_clamped` và hóa đơn private."""

    def test_create_full_data_clamped_warranty_and_private_invoice(
        self, user: Any, login: Any, vnd: Any
    ) -> None:
        grant(user, P.CREATE, AttachmentPermission.FILE_READ, AttachmentPermission.FILE_UPDATE)
        # File upload ảnh (mặc định PUBLIC) phải tự chuyển sang PRIVATE khi gắn hóa đơn thiết bị.
        png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 24
        # Tạo attachment công khai trực tiếp hoặc qua AttachmentService nếu định dạng hợp lệ
        att = Attachment.objects.create(
            created_by=user,
            original_name="hoa-don.pdf",
            content_type="application/pdf",
            size=len(png_bytes),
            visibility=Attachment.Visibility.PRIVATE,
            file="private/test.pdf",
        )
        api = login(user)

        res = api.post(
            URL,
            {
                "name": "MacBook Pro M4",
                "brand": "Apple",
                "category": "LAPTOP",
                "purchase_date": "2026-01-31",
                "purchase_price": "45000000",
                "currency_id": str(vnd.pk),
                "purchase_store": "TopZone",
                "purchase_channel": "OFFICIAL_STORE",
                "warranty_type": "MANUFACTURER",
                "warranty_months": 1,
                "invoice_attachment_ids": [str(att.pk)],
            },
            format="json",
        )
        data = self.assert_success(res, 201)
        assert data["name"] == "MacBook Pro M4"
        assert data["warranty_start_date"] == "2026-01-31"
        # 31/01 + 1 tháng kẹp đúng 28/02/2026 (không lỗi ValueError hoặc sang 03/03).
        assert data["warranty_end_date"] == "2026-02-28"
        assert data["exchange_rate"] == "1.000000"
        assert data["purchase_price_vnd"] == "45000000"
        assert len(data["invoice_attachments"]) == 1

    def test_create_foreign_currency_requires_rate_when_missing_or_resolves_db_rate(
        self, user: Any, login: Any, usd: Any
    ) -> None:
        grant(user, P.CREATE)
        api = login(user)

        missing_rate = api.post(
            URL,
            {
                "name": "SSD Ngoại tệ",
                "purchase_date": "2026-11-10",
                "purchase_price": "100.00",
                "currency_id": str(usd.pk),
            },
            format="json",
        )
        self.assert_error(missing_rate, 400, "WORKSPACE_CURRENCY_RATE_REQUIRED")

        ExchangeRate.objects.create(
            currency=usd,
            rate_date=date(2026, 11, 9),
            rate=Decimal("25500"),
            source=ExchangeRate.Source.MANUAL,
        )
        resolved = api.post(
            URL,
            {
                "name": "SSD Ngoại tệ OK",
                "purchase_date": "2026-11-10",
                "purchase_price": "100.00",
                "currency_id": str(usd.pk),
            },
            format="json",
        )
        data = self.assert_success(resolved, 201)
        assert data["purchase_price_vnd"] == "2550000"

    def test_create_min_data_and_validation_and_auth(
        self, user: Any, login: Any, client: Any, vnd: Any
    ) -> None:
        self.assert_unauthorized(client.post(URL, {}, format="json"))
        self.assert_forbidden(login(user).post(URL, {}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CREATE)
        api = login(user)
        self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")

        res = api.post(
            URL,
            {"name": "Chuột tối thiểu", "purchase_date": "2026-11-15", "currency_id": str(vnd.pk)},
            format="json",
        )
        data = self.assert_success(res, 201)
        assert data["status"] == "IN_USE"
        assert "notification_channels" not in data

        unknown_channels = api.post(
            URL,
            {
                "name": "Bàn phím cơ",
                "purchase_date": "2026-11-15",
                "currency_id": str(vnd.pk),
                "notification_channels": ["EMAIL"],
            },
            format="json",
        )
        self.assert_error(unknown_channels, 400, "VALIDATION_ERROR")
