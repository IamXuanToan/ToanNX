"""Kiểm thử tạo Phiếu Bảo hành: POST /api/v1/workspace/warranty-claims."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_warranty_claim_permission import (
    AssetWarrantyClaimPermission as P,
)

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/warranty-claims"


class TestWarrantyClaimCreateApi(BaseApiTestCase):
    """Kiểm thử tự sinh `BH-YYYYMM-NNN`, kiểm `asset` thuộc owner, conflict code & đồng bộ Asset status."""

    def test_create_auto_code_syncs_asset_and_detects_conflict(self, user: Any, login: Any, vnd: Any) -> None:
        other = UserFactory()
        asset = Asset.objects.create(owner=user, name="Laptop", purchase_date=date(2026, 1, 1), currency=vnd)
        other_asset = Asset.objects.create(
            owner=other, name="Other", purchase_date=date(2026, 1, 1), currency=vnd
        )
        grant(user, P.CREATE)
        api = login(user)

        res1 = api.post(
            URL,
            {
                "asset_id": str(asset.pk),
                "claim_type": "WARRANTY",
                "submitted_date": "2026-11-05",
                "service_center": "TTBH Hãng",
                "issue_description": "Lỗi loa rè",
                "currency_id": str(vnd.pk),
            },
            format="json",
        )
        d1 = self.assert_success(res1, 201)
        assert d1["claim_code"] == "BH-202611-001"
        asset.refresh_from_db()
        assert asset.status == Asset.Status.IN_WARRANTY

        # Trùng mã phiếu cùng owner → 409 WORKSPACE_CLAIM_CODE_CONFLICT
        conflict = api.post(
            URL,
            {
                "asset_id": str(asset.pk),
                "claim_code": "BH-202611-001",
                "submitted_date": "2026-11-06",
                "service_center": "TTBH Hãng",
                "issue_description": "Gửi lại",
                "currency_id": str(vnd.pk),
            },
            format="json",
        )
        self.assert_error(conflict, 409, "WORKSPACE_CLAIM_CODE_CONFLICT")

        # Chọn thiết bị của người khác → 404
        forbidden_asset = api.post(
            URL,
            {
                "asset_id": str(other_asset.pk),
                "submitted_date": "2026-11-06",
                "service_center": "TTBH",
                "issue_description": "Test",
                "currency_id": str(vnd.pk),
            },
            format="json",
        )
        self.assert_error(forbidden_asset, 404, "NOT_FOUND")
