"""Nghiệp vụ Két sắt Bí mật cá nhân (mã hóa SecretCipher & giải mã có ghi vết audit)."""

from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.secret_cipher_error import SecretCipherError
from app.core.security.secret_cipher import SecretCipher
from app.core.services.core_crud_service import CoreCrudService
from app.workspace.constants.workspace_defaults import SECRET_CIPHER_PURPOSE
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission
from app.workspace.repositories.vault_item_repository import VaultItemRepository


class VaultItemService(CoreCrudService[VaultItem, VaultItemRepository]):
    """Lưu trữ và giải mã bí mật theo đúng chủ sở hữu; không bao giờ cấp cho AI."""

    repository_class = VaultItemRepository
    owner_field = "owner"
    manage_all_permission = VaultItemPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: VaultItemRepository | None = None,
        cipher: SecretCipher | None = None,
    ) -> None:
        """Khởi tạo repository và SecretCipher."""
        super().__init__(repository or VaultItemRepository())
        self.cipher = cipher or SecretCipher()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> VaultItem:
        """Mã hóa bí mật đầu vào trước khi lưu DB, chỉ giữ 4 ký tự cuối để nhận diện."""
        payload = dict(data)
        raw_secret = str(payload.pop("secret"))
        payload["secret_encrypted"] = self.cipher.encrypt(SECRET_CIPHER_PURPOSE, raw_secret)
        payload["secret_last4"] = raw_secret[-4:] if raw_secret else ""
        return super().create(actor, payload)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> VaultItem:
        """Nếu gửi `secret` mới khác rỗng thì mã hóa lại; bỏ trống/không gửi thì giữ nguyên."""
        item = self.get_for_write(actor, pk)
        payload = dict(data)
        raw_secret = payload.pop("secret", None)
        if raw_secret is not None and str(raw_secret) != "":
            secret_str = str(raw_secret)
            payload["secret_encrypted"] = self.cipher.encrypt(SECRET_CIPHER_PURPOSE, secret_str)
            payload["secret_last4"] = secret_str[-4:]
        return self.repository.update(item, actor=actor, **payload)

    @transaction.atomic
    def reveal(self, actor: Any, pk: Any) -> dict[str, Any]:
        """Giải mã bản rõ và ghi lại dấu vết `last_revealed_at`/`last_revealed_by` + journal."""
        item = self.get_for_write(actor, pk)
        try:
            plaintext = self.cipher.decrypt(SECRET_CIPHER_PURPOSE, item.secret_encrypted)
        except SecretCipherError as exc:
            raise BusinessRuleError(
                "Không thể giải mã bí mật (khóa hệ thống có thể đã thay đổi).",
                code=ErrorCode.BUSINESS_RULE_VIOLATION,
            ) from exc

        now = timezone.now()
        updated = self.repository.update(
            item,
            actor=actor,
            last_revealed_at=now,
            last_revealed_by=actor,
        )
        self.log_event(
            updated,
            "workspace.vault.revealed",
            {"last4": updated.secret_last4},
            actor=actor,
        )
        return {
            "id": str(updated.pk),
            "title": updated.title,
            "username": updated.username,
            "secret": plaintext,
            "url": updated.url,
            "revealed_at": now,
            "revealed_by_email": getattr(actor, "email", ""),
        }
