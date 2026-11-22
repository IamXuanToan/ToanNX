"""Mã hóa bí mật bên thứ ba của từng người dùng (token SePay, token bot Telegram) để lưu DB.

Khóa Fernet dẫn xuất từ `DJANGO_SECRET_KEY` theo từng mục đích (`salted_hmac`), không thêm biến env. Đổi
`DJANGO_SECRET_KEY` thì bản mã cũ không giải được nữa: nơi gọi bắt `SecretCipherError` và yêu cầu nhập lại.
"""

import base64

from cryptography.fernet import Fernet, InvalidToken
from django.utils.crypto import salted_hmac

from app.core.exceptions.secret_cipher_error import SecretCipherError

KEY_SALT_PREFIX = "secret_cipher."
KEY_VALUE = "fernet-key"


class SecretCipher:
    """Mã hóa/giải mã chuỗi theo mục đích (`purpose`), mỗi mục đích một khóa riêng."""

    def encrypt(self, purpose: str, plaintext: str) -> str:
        """Mã hóa chuỗi.

        Args:
            purpose: Mục đích, ví dụ `finance.sepay.token`.
            plaintext: Bí mật gốc.

        Returns:
            Bản mã ASCII.
        """
        return self._fernet(purpose).encrypt(plaintext.encode()).decode()

    def decrypt(self, purpose: str, token: str) -> str:
        """Giải mã chuỗi.

        Args:
            purpose: Mục đích lúc mã hóa.
            token: Bản mã.

        Returns:
            Bí mật gốc.

        Raises:
            SecretCipherError: Bản mã hỏng hoặc khóa đã đổi.
        """
        try:
            return self._fernet(purpose).decrypt(token.encode()).decode()
        except (InvalidToken, ValueError) as exc:
            raise SecretCipherError() from exc

    def _fernet(self, purpose: str) -> Fernet:
        digest = salted_hmac(f"{KEY_SALT_PREFIX}{purpose}", KEY_VALUE, algorithm="sha256").digest()
        return Fernet(base64.urlsafe_b64encode(digest))
