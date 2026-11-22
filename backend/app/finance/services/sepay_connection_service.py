"""Kết nối SePay của từng người: token API (mã hóa), URL webhook riêng, secret webhook dẫn xuất."""

from typing import Any

from django.db import transaction
from django.utils import timezone
from django.utils.crypto import salted_hmac

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.secret_cipher_error import SecretCipherError
from app.core.security.secret_cipher import SecretCipher
from app.core.utils.url import build_backend_url
from app.finance.constants.finance_defaults import SEPAY_TOKEN_PURPOSE, SEPAY_WEBHOOK_SECRET_SALT, TOKEN_TAIL
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.sepay_connection import SepayConnection
from app.finance.repositories.sepay_connection_repository import SepayConnectionRepository
from app.finance.services.sepay_api_client import SepayApiClient

WEBHOOK_PATH = "/api/v1/finance/sepay/webhook/{public_id}"


class SepayConnectionService:
    """Mỗi người một kết nối; secret webhook không lưu DB (đổi bằng `secret_version`)."""

    def __init__(
        self,
        repository: SepayConnectionRepository | None = None,
        client: SepayApiClient | None = None,
        cipher: SecretCipher | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or SepayConnectionRepository()
        self.client = client or SepayApiClient()
        self.cipher = cipher or SecretCipher()

    def get_for(self, actor: Any) -> SepayConnection | None:
        """Kết nối của actor."""
        return self.repository.find_one(owner_id=actor.pk)

    def require_for(self, actor: Any) -> SepayConnection:
        """Kết nối có token, chưa có thì `FINANCE_SEPAY_NOT_CONNECTED`."""
        connection = self.get_for(actor)
        if connection is None or not connection.api_token_encrypted:
            raise BusinessRuleError("Chưa kết nối SePay.", code=FinanceErrorCode.SEPAY_NOT_CONNECTED)
        return connection

    def status(self, actor: Any) -> dict[str, Any]:
        """Trạng thái cho màn Kết nối SePay (gồm URL webhook và secret của chính mình)."""
        connection = self.get_for(actor)
        if connection is None:
            return {"connected": False, "connection": None, "webhook_url": "", "webhook_secret": ""}
        return {
            "connected": bool(connection.api_token_encrypted),
            "connection": connection,
            "webhook_url": build_backend_url(WEBHOOK_PATH.format(public_id=connection.public_id)),
            "webhook_secret": self.secret_for(connection),
        }

    @transaction.atomic
    def save(self, actor: Any, token: str | None, is_active: bool | None) -> SepayConnection:
        """Lưu token (kiểm bằng `/v2/bank-accounts`) và/hoặc bật/tắt; chưa có kết nối thì tạo."""
        fields: dict[str, Any] = {}
        if token:
            token = token.strip()
            self.client.list_bank_accounts(token)
            fields.update(
                api_token_encrypted=self.cipher.encrypt(SEPAY_TOKEN_PURPOSE, token),
                token_last4=token[-TOKEN_TAIL:],
                last_error="",
            )
        if is_active is not None:
            fields["is_active"] = is_active
        connection = self.get_for(actor)
        if connection is None:
            return self.repository.create(actor=actor, owner=actor, **fields)
        return self.repository.update(connection, actor=actor, **fields)

    def test(self, actor: Any) -> int:
        """Số tài khoản ngân hàng liên kết (token hợp lệ)."""
        return len(self.client.list_bank_accounts(self.token_for(self.require_for(actor))))

    @transaction.atomic
    def rotate_secret(self, actor: Any) -> SepayConnection:
        """Tạo secret mới (secret cũ hết hiệu lực ngay)."""
        connection = self.get_for(actor)
        if connection is None:
            raise NotFoundError()
        return self.repository.update(connection, actor=actor, secret_version=connection.secret_version + 1)

    @transaction.atomic
    def delete(self, actor: Any) -> None:
        """Xóa kết nối (token, URL webhook cũ hết hiệu lực)."""
        connection = self.get_for(actor)
        if connection is None:
            raise NotFoundError()
        self.repository.hard_delete(connection)

    def secret_for(self, connection: SepayConnection) -> str:
        """Secret webhook = salted_hmac(public_id:secret_version) từ DJANGO_SECRET_KEY."""
        return salted_hmac(
            SEPAY_WEBHOOK_SECRET_SALT,
            f"{connection.public_id}:{connection.secret_version}",
            algorithm="sha256",
        ).hexdigest()

    def token_for(self, connection: SepayConnection) -> str:
        """Giải mã token; khóa đổi thì yêu cầu nhập lại."""
        try:
            return self.cipher.decrypt(SEPAY_TOKEN_PURPOSE, connection.api_token_encrypted)
        except SecretCipherError as exc:
            self.repository.update(connection, last_error=FinanceErrorCode.SEPAY_TOKEN_INVALID)
            raise BusinessRuleError(
                "Cần nhập lại token SePay.", code=FinanceErrorCode.SEPAY_TOKEN_INVALID
            ) from exc

    def find_active(self, public_id: Any) -> SepayConnection | None:
        """Kết nối đang bật theo mã công khai (webhook)."""
        connection = self.repository.find_by_public_id(public_id)
        return connection if connection is not None and connection.is_active else None

    def touch_webhook(self, connection: SepayConnection) -> None:
        """Ghi lần nhận webhook hợp lệ."""
        self.repository.update(connection, last_webhook_at=timezone.now())

    def touch_sync(self, connection: SepayConnection) -> None:
        """Ghi lần lấy thủ công."""
        self.repository.update(connection, last_sync_at=timezone.now(), last_error="")
