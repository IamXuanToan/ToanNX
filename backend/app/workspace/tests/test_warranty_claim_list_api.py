"""Kiểm thử danh sách Phiếu Bảo hành: GET /api/v1/workspace/warranty-claims."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.permissions.asset_warranty_claim_permission import (
    AssetWarrantyClaimPermission as P,
)

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/warranty-claims"


class TestWarrantyClaimListApi(BaseApiTestCase):
    """Kiểm thử phân trang, lọc `claim_type`/`status`, cách ly owner và 401/403."""

    def test_list_filter_and_isolation(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        a1 = Asset.objects.create(owner=user, name="MacBook", purchase_date=date(2026, 10, 1), currency=vnd)
        a2 = Asset.objects.create(owner=other, name="Dell", purchase_date=date(2026, 10, 1), currency=vnd)
        AssetWarrantyClaim.objects.create(
            owner=user,
            asset=a1,
            claim_code="BH-202611-001",
            claim_type=AssetWarrantyClaim.ClaimType.WARRANTY,
            submitted_date=date(2026, 11, 2),
            service_center="Thakral One",
            issue_description="Chết điểm ảnh",
            currency=vnd,
        )
        AssetWarrantyClaim.objects.create(
            owner=other,
            asset=a2,
            claim_code="BH-202611-001",
            submitted_date=date(2026, 11, 2),
            service_center="TTBH Dell",
            issue_description="Pin phồng",
            currency=vnd,
        )

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        items, pag = self.assert_paginated(api.get(URL, {"claim_type": "WARRANTY", "page": 1}))
        assert pag["total"] == 1
        assert items[0]["claim_code"] == "BH-202611-001"
