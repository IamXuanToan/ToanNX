"""Kiểm thử tạo Két sắt Bí mật: POST /api/v1/workspace/vault-items."""

from typing import Any

import pytest

from app.core.security.secret_cipher import SecretCipher
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.journal_entry import JournalEntry
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/vault-items"


class TestVaultCreateApi(BaseApiTestCase):
    """Kiểm thử mã hóa Fernet SecretCipher và che bí mật trong JournalEntry."""

    def test_create_encrypts_secret_and_masks_journal(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.post(URL, {}, format="json"))
        self.assert_forbidden(login(user).post(URL, {}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CREATE)
        res = login(user).post(
            URL,
            {
                "title": "API Key OpenAI",
                "category": "API_KEY",
                "username": "sk-proj",
                "secret": "sk-test-my-secret-value-abcd",
                "url": "https://platform.openai.com",
            },
            format="json",
        )
        self.assert_no_sensitive_data(res)
        data = self.assert_success(res, 201)
        assert data["secret_last4"] == "abcd"

        item = VaultItem.objects.get(pk=data["id"])
        assert item.secret_encrypted != "sk-test-my-secret-value-abcd"
        assert (
            SecretCipher().decrypt("workspace.vault.secret", item.secret_encrypted)
            == "sk-test-my-secret-value-abcd"
        )
        entries = JournalEntry.objects.filter(resource="workspace.vaultitem", object_id=str(item.pk))
        assert entries.exists()
        assert "sk-test-my-secret-value-abcd" not in str(list(entries.values()))
