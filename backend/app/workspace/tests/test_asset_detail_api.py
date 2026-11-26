"""Kiểm thử chi tiết Thiết bị: GET /api/v1/workspace/assets/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission as P

pytestmark = pytest.mark.django_db


class TestAssetDetailApi(BaseApiTestCase):
    """Kiểm thử lấy chi tiết, cô lập owner (404) và `MANAGE_ALL`."""

    def test_detail_owner_other_and_manage_all(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        mine = Asset.objects.create(
            owner=user, name="Keychron Q1", purchase_date=date(2026, 11, 1), currency=vnd
        )
        theirs = Asset.objects.create(
            owner=other, name="Hàng Khác", purchase_date=date(2026, 11, 1), currency=vnd
        )

        self.assert_unauthorized(client.get(f"/api/v1/workspace/assets/{mine.pk}"))
        self.assert_forbidden(login(user).get(f"/api/v1/workspace/assets/{mine.pk}"), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        data = self.assert_success(api.get(f"/api/v1/workspace/assets/{mine.pk}"))
        assert data["name"] == "Keychron Q1"
        self.assert_error(api.get(f"/api/v1/workspace/assets/{theirs.pk}"), 404, "NOT_FOUND")

        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        data_other = self.assert_success(login(user).get(f"/api/v1/workspace/assets/{theirs.pk}"))
        assert data_other["name"] == "Hàng Khác"
