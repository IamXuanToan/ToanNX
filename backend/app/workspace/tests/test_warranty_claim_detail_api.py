"""Kiểm thử chi tiết Phiếu Bảo hành: GET /api/v1/workspace/warranty-claims/{id}."""

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


class TestWarrantyClaimDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết phiếu BH, owner isolation & 401/403."""

    def test_detail_and_isolation(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        a1 = Asset.objects.create(owner=user, name="TB1", purchase_date=date(2026, 1, 1), currency=vnd)
        a2 = Asset.objects.create(owner=other, name="TB2", purchase_date=date(2026, 1, 1), currency=vnd)
        c1 = AssetWarrantyClaim.objects.create(
            owner=user,
            asset=a1,
            claim_code="BH-1",
            submitted_date=date(2026, 11, 1),
            service_center="SC",
            issue_description="Err",
            currency=vnd,
        )
        c2 = AssetWarrantyClaim.objects.create(
            owner=other,
            asset=a2,
            claim_code="BH-2",
            submitted_date=date(2026, 11, 1),
            service_center="SC",
            issue_description="Err",
            currency=vnd,
        )

        self.assert_unauthorized(client.get(f"/api/v1/workspace/warranty-claims/{c1.pk}"))
        self.assert_forbidden(
            login(user).get(f"/api/v1/workspace/warranty-claims/{c1.pk}"), "PERMISSION_DENIED"
        )

        grant(user, P.READ)
        api = login(user)
        assert (
            self.assert_success(api.get(f"/api/v1/workspace/warranty-claims/{c1.pk}"))["claim_code"] == "BH-1"
        )
        self.assert_error(api.get(f"/api/v1/workspace/warranty-claims/{c2.pk}"), 404, "NOT_FOUND")
