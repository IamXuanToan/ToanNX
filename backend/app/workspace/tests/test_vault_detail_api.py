"""Kiểm thử chi tiết Két sắt: GET /api/v1/workspace/vault-items/{id}."""

from typing import Any

import pytest

from app.core.security.secret_cipher import SecretCipher
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P

pytestmark = pytest.mark.django_db


class TestVaultDetailApi(BaseApiTestCase):
    """Kiểm thử GET chi tiết không lộ bản rõ và cách ly owner."""

    def test_detail_and_isolation(self, user: Any, login: Any) -> None:
        other = UserFactory()
        mine = VaultItem.objects.create(
            owner=user,
            title="Mine",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "MyRawPass"),
            secret_last4="Pass",
        )
        theirs = VaultItem.objects.create(
            owner=other,
            title="Theirs",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "TheirPass"),
            secret_last4="Pass",
        )
        grant(user, P.READ)
        api = login(user)
        res = api.get(f"/api/v1/workspace/vault-items/{mine.pk}")
        self.assert_no_sensitive_data(res)
        assert self.assert_success(res)["title"] == "Mine"
        self.assert_error(api.get(f"/api/v1/workspace/vault-items/{theirs.pk}"), 404, "NOT_FOUND")
