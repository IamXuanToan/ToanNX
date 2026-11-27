"""Kiểm thử xóa hàng loạt Phiếu Bảo hành: POST /api/v1/workspace/warranty-claims/bulk-delete."""

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


class TestWarrantyClaimBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete nhiều phiếu BH."""

    def test_bulk_delete_success(self, user: Any, login: Any, vnd: Any) -> None:
        asset = Asset.objects.create(owner=user, name="TB", purchase_date=date(2026, 1, 1), currency=vnd)
        c1 = AssetWarrantyClaim.objects.create(
            owner=user,
            asset=asset,
            claim_code="BH-1",
            submitted_date=date(2026, 11, 1),
            service_center="SC",
            issue_description="Err",
            currency=vnd,
        )
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/warranty-claims/bulk-delete", {"ids": [str(c1.pk)]}, format="json"
            )
        )
        assert data["count"] == 1
