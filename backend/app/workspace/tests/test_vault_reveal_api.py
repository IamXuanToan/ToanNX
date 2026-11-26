"""Kiểm thử giải mã Két sắt: POST /api/v1/workspace/vault-items/{id}/reveal."""

from typing import Any

import pytest

from app.core.security.secret_cipher import SecretCipher
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.journal_entry import JournalEntry
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P

pytestmark = pytest.mark.django_db


class TestVaultRevealApi(BaseApiTestCase):
    """Kiểm thử quyền `vault_item.reveal`, ghi audit `last_revealed_by` + journal masked, ADMIN manage_all."""

    def test_reveal_audit_permissions_and_isolation(
        self, user: Any, superuser: Any, login: Any, client: Any
    ) -> None:
        other = UserFactory()
        item = VaultItem.objects.create(
            owner=user,
            title="DB Password",
            username="postgres",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "UltraSecret!123"),
            secret_last4="!123",
        )
        other_item = VaultItem.objects.create(
            owner=other,
            title="Other Secret",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", "Other!999"),
            secret_last4="!999",
        )

        self.assert_unauthorized(client.post(f"/api/v1/workspace/vault-items/{item.pk}/reveal"))
        # Có READ nhưng thiếu REVEAL → 403
        grant(user, P.READ)
        self.assert_forbidden(
            login(user).post(f"/api/v1/workspace/vault-items/{item.pk}/reveal"),
            "PERMISSION_DENIED",
        )

        # Có REVEAL → giải mã thành công và ghi dấu vết
        grant(user, P.REVEAL)
        user = type(user).objects.get(pk=user.pk)
        api = login(user)
        revealed = self.assert_success(api.post(f"/api/v1/workspace/vault-items/{item.pk}/reveal"))
        assert revealed["secret"] == "UltraSecret!123"
        assert revealed["revealed_by_email"] == user.email

        item.refresh_from_db()
        assert item.last_revealed_at is not None
        assert item.last_revealed_by_id == user.pk

        # Journal sự kiện reveal cũng không được chứa bản rõ
        j = JournalEntry.objects.filter(
            resource="workspace.vaultitem", object_id=str(item.pk), action="EVENT"
        )
        assert j.exists()
        assert "UltraSecret!123" not in str(list(j.values()))

        # Người khác dù có REVEAL nhưng thiếu MANAGE_ALL → 404
        self.assert_error(api.post(f"/api/v1/workspace/vault-items/{other_item.pk}/reveal"), 404, "NOT_FOUND")

        # Superuser / ADMIN có toàn quyền vẫn mở xem được (ghi nhận last_revealed_by=superuser)
        admin_reveal = self.assert_success(
            login(superuser).post(f"/api/v1/workspace/vault-items/{other_item.pk}/reveal")
        )
        assert admin_reveal["secret"] == "Other!999"
        other_item.refresh_from_db()
        assert other_item.last_revealed_by_id == superuser.pk
