"""Kiểm thử danh sách Két sắt Bí mật: GET /api/v1/workspace/vault-items."""

from typing import Any

import pytest

from app.core.security.secret_cipher import SecretCipher
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/vault-items"


class TestVaultListApi(BaseApiTestCase):
    """Đảm bảo danh sách luôn che bản rõ, không lộ `secret_encrypted` và cô lập owner."""

    def test_list_masks_secrets_and_isolates_owner(self, user: Any, login: Any, client: Any) -> None:
        other = UserFactory()
        VaultItem.objects.create(
            owner=user,
            title="SSH Prod",
            category=VaultItem.Category.SERVER,
            username="root",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "SuperSecret9999"),
            secret_last4="9999",
        )
        VaultItem.objects.create(
            owner=other,
            title="Other Key",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "OtherSecret"),
            secret_last4="cret",
        )

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        res = login(user).get(URL, {"category": "SERVER", "page": 1})
        self.assert_no_sensitive_data(res)
        items, pag = self.assert_paginated(res)
        assert pag["total"] == 1
        assert items[0]["secret_last4"] == "9999"
        assert "secret_encrypted" not in items[0]
        assert "SuperSecret9999" not in str(items[0])
