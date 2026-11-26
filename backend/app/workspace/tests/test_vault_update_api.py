"""Kiểm thử cập nhật Két sắt: PATCH /api/v1/workspace/vault-items/{id}."""

from typing import Any

import pytest

from app.core.security.secret_cipher import SecretCipher
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P

pytestmark = pytest.mark.django_db


class TestVaultUpdateApi(BaseApiTestCase):
    """Kiểm thử bỏ trống/không gửi `secret` vẫn giữ nguyên bản mã hóa cũ."""

    def test_update_blank_secret_preserves_existing_encrypted_value(self, user: Any, login: Any) -> None:
        encrypted = SecretCipher().encrypt("workspace.vault.secret", "KeepMeIntact1234")
        item = VaultItem.objects.create(
            owner=user,
            title="Old Title",
            secret_encrypted=encrypted,
            secret_last4="1234",
        )
        grant(user, P.UPDATE)
        api = login(user)

        res = api.patch(
            f"/api/v1/workspace/vault-items/{item.pk}",
            {"title": "New Title", "secret": ""},
            format="json",
        )
        data = self.assert_success(res)
        assert data["title"] == "New Title"
        assert data["secret_last4"] == "1234"
        item.refresh_from_db()
        assert SecretCipher().decrypt("workspace.vault.secret", item.secret_encrypted) == "KeepMeIntact1234"
