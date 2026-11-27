"""Kiểm thử endpoint danh sách Thiết bị: GET /api/v1/workspace/assets."""

from datetime import date, timedelta
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assets"


class TestAssetListApi(BaseApiTestCase):
    """Kiểm thử lọc, tìm kiếm, phân trang, cách ly owner và 401/403 trên GET /workspace/assets."""

    def test_list_paginated_filter_search_ordering(self, user: Any, login: Any, vnd: Any) -> None:
        grant(user, P.READ)
        today = date(2026, 11, 1)
        Asset.objects.create(
            owner=user,
            name="MacBook Pro 16",
            brand="Apple",
            category=Asset.Category.LAPTOP,
            status=Asset.Status.IN_USE,
            purchase_date=today,
            purchase_price=50000000,
            purchase_price_vnd=50000000,
            currency=vnd,
            purchase_store="Apple Store",
        )
        Asset.objects.create(
            owner=user,
            name="iPhone 16",
            brand="Apple",
            category=Asset.Category.PHONE,
            status=Asset.Status.BACKUP,
            purchase_date=today - timedelta(days=5),
            purchase_price=25000000,
            purchase_price_vnd=25000000,
            currency=vnd,
        )
        api = login(user)

        items, pagination = self.assert_paginated(api.get(URL, {"page": 1, "page_size": 10}))
        assert pagination["total"] == 2
        assert len(items) == 2

        laptops, _ = self.assert_paginated(
            api.get(URL, {"category": "LAPTOP", "search": "MacBook", "page": 1})
        )
        assert len(laptops) == 1
        assert laptops[0]["name"] == "MacBook Pro 16"

        ordered, _ = self.assert_paginated(api.get(URL, {"ordering": "purchase_price_vnd", "page": 1}))
        assert ordered[0]["name"] == "iPhone 16"

    def test_list_owner_isolation_and_manage_all(self, user: Any, login: Any, vnd: Any) -> None:
        other = UserFactory()
        today = date(2026, 11, 1)
        Asset.objects.create(owner=user, name="Của Tôi", purchase_date=today, currency=vnd)
        Asset.objects.create(owner=other, name="Người Khác", purchase_date=today, currency=vnd)

        grant(user, P.READ)
        api = login(user)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination["total"] == 1
        assert items[0]["name"] == "Của Tôi"

        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        items_all, pag_all = self.assert_paginated(login(user).get(URL, {"page": 1}))
        assert pag_all["total"] == 2

    def test_list_auth_errors(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")
