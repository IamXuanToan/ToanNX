"""Kiểm thử xóa mềm Phiếu Bảo hành: DELETE /api/v1/workspace/warranty-claims/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.permissions.asset_warranty_claim_permission import (
    AssetWarrantyClaimPermission as P,
)

pytestmark = pytest.mark.django_db


class TestWarrantyClaimDeleteApi(BaseApiTestCase):
    """Xóa phiếu đang mở đưa thiết bị về `IN_USE` và cho phép tái sử dụng `claim_code`."""

    def test_delete_reverts_asset_and_allows_reuse_claim_code(self, user: Any, login: Any, vnd: Any) -> None:
        asset = Asset.objects.create(
            owner=user,
            name="Phone",
            status=Asset.Status.IN_WARRANTY,
            purchase_date=date(2026, 1, 1),
            currency=vnd,
        )
        claim = AssetWarrantyClaim.objects.create(
            owner=user,
            asset=asset,
            claim_code="BH-CUSTOM-01",
            status=AssetWarrantyClaim.Status.INSPECTING,
            submitted_date=date(2026, 11, 2),
            service_center="TTBH",
            issue_description="Lỗi màn",
            currency=vnd,
        )
        grant(user, P.DELETE, P.CREATE)
        api = login(user)

        assert api.delete(f"/api/v1/workspace/warranty-claims/{claim.pk}").status_code == 204
        asset.refresh_from_db()
        assert asset.status == Asset.Status.IN_USE

        # Nhờ UniqueConstraint condition deleted_at__isnull=True nên tạo lại mã cũ thành công.
        reused = api.post(
            "/api/v1/workspace/warranty-claims",
            {
                "asset_id": str(asset.pk),
                "claim_code": "BH-CUSTOM-01",
                "submitted_date": "2026-11-05",
                "service_center": "TTBH",
                "issue_description": "Gửi lại",
                "currency_id": str(vnd.pk),
            },
            format="json",
        )
        self.assert_success(reused, 201)
