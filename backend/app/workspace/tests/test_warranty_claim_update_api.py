"""Kiểm thử cập nhật Phiếu Bảo hành: PATCH /api/v1/workspace/warranty-claims/{id}."""

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


class TestWarrantyClaimUpdateApi(BaseApiTestCase):
    """Đóng phiếu `COMPLETED` tự trả Asset về `IN_USE` và tính `part_warranty_end_date`."""

    def test_complete_claim_reverts_asset_and_calculates_part_warranty(
        self, user: Any, login: Any, vnd: Any
    ) -> None:
        asset = Asset.objects.create(
            owner=user,
            name="Laptop",
            status=Asset.Status.IN_WARRANTY,
            purchase_date=date(2026, 1, 1),
            currency=vnd,
        )
        claim = AssetWarrantyClaim.objects.create(
            owner=user,
            asset=asset,
            claim_code="BH-202611-001",
            status=AssetWarrantyClaim.Status.SUBMITTED,
            submitted_date=date(2026, 11, 1),
            service_center="TTBH",
            issue_description="Mất nguồn",
            currency=vnd,
        )
        grant(user, P.UPDATE)
        api = login(user)

        res = api.patch(
            f"/api/v1/workspace/warranty-claims/{claim.pk}",
            {
                "status": "COMPLETED",
                "returned_date": "2026-11-30",
                "part_warranty_months": 3,
                "resolution_notes": "Thay mainboard mới",
                "is_covered_by_warranty": True,
            },
            format="json",
        )
        data = self.assert_success(res)
        assert data["status"] == "COMPLETED"
        assert data["part_warranty_end_date"] == "2027-02-28"
        asset.refresh_from_db()
        assert asset.status == Asset.Status.IN_USE
