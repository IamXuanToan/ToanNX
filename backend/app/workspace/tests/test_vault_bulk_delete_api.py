"""Kiểm thử xóa hàng loạt Két sắt: POST /api/v1/workspace/vault-items/bulk-delete."""

from typing import Any

import pytest

from app.core.security.secret_cipher import SecretCipher
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P

pytestmark = pytest.mark.django_db


class TestVaultBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete mục két sắt."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        item = VaultItem.objects.create(
            owner=user,
            title="Del",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "x"),
            secret_last4="x",
        )
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/vault-items/bulk-delete", {"ids": [str(item.pk)]}, format="json"
            )
        )
        assert data["count"] == 1
