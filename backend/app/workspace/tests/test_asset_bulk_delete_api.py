"""Kiểm thử xóa hàng loạt Thiết bị: POST /api/v1/workspace/assets/bulk-delete."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assets/bulk-delete"


class TestAssetBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử transaction nguyên tử khi lẫn ID người khác và MANAGE_ALL."""

    def test_bulk_delete_atomic_and_manage_all(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        a1 = Asset.objects.create(owner=user, name="A1", purchase_date=date(2026, 11, 1), currency=vnd)
        a2 = Asset.objects.create(owner=user, name="A2", purchase_date=date(2026, 11, 1), currency=vnd)
        theirs = Asset.objects.create(owner=other, name="T", purchase_date=date(2026, 11, 1), currency=vnd)

        self.assert_unauthorized(client.post(URL, {"ids": [str(a1.pk)]}, format="json"))
        self.assert_forbidden(
            login(user).post(URL, {"ids": [str(a1.pk)]}, format="json"), "PERMISSION_DENIED"
        )

        grant(user, P.DELETE)
        api = login(user)
        # Lẫn 1 ID của người khác → toàn bộ rollback.
        self.assert_error(
            api.post(URL, {"ids": [str(a1.pk), str(theirs.pk)]}, format="json"), 404, "NOT_FOUND"
        )
        assert Asset.objects.filter(pk=a1.pk).exists() is True

        res = api.post(URL, {"ids": [str(a1.pk), str(a2.pk)]}, format="json")
        data = self.assert_success(res)
        assert data["count"] == 2
        assert Asset.objects.alive().filter(pk__in=[a1.pk, a2.pk]).count() == 0
