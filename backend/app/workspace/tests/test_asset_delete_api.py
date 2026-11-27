"""Kiểm thử xóa mềm Thiết bị: DELETE /api/v1/workspace/assets/{id}."""

from datetime import date
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission as P

pytestmark = pytest.mark.django_db


class TestAssetDeleteApi(BaseApiTestCase):
    """Kiểm thử DELETE 204 xóa mềm, 404 owner khác, 401/403."""

    def test_delete_soft_and_isolation(self, user: Any, login: Any, client: Any, vnd: Any) -> None:
        other = UserFactory()
        mine = Asset.objects.create(owner=user, name="Loa", purchase_date=date(2026, 11, 1), currency=vnd)
        theirs = Asset.objects.create(owner=other, name="Khác", purchase_date=date(2026, 11, 1), currency=vnd)

        self.assert_unauthorized(client.delete(f"/api/v1/workspace/assets/{mine.pk}"))
        self.assert_forbidden(login(user).delete(f"/api/v1/workspace/assets/{mine.pk}"), "PERMISSION_DENIED")

        grant(user, P.DELETE)
        api = login(user)
        assert api.delete(f"/api/v1/workspace/assets/{mine.pk}").status_code == 204
        assert Asset.objects.alive().filter(pk=mine.pk).exists() is False
        assert Asset.objects.get(pk=mine.pk).deleted_at is not None

        self.assert_error(api.delete(f"/api/v1/workspace/assets/{theirs.pk}"), 404, "NOT_FOUND")

        grant(user, P.MANAGE_ALL)
        user = type(user).objects.get(pk=user.pk)
        assert login(user).delete(f"/api/v1/workspace/assets/{theirs.pk}").status_code == 204
