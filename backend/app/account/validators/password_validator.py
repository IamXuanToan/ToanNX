"""Kiểm tra mật khẩu mạnh của tài khoản (theo `AUTH_PASSWORD_VALIDATORS`)."""

from typing import Any

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from app.account.constants.account_error_code import AccountErrorCode
from app.core.exceptions.validation_error import ValidationError


class PasswordValidator:
    """Quy tắc mật khẩu của module Account."""

    @staticmethod
    def validate_strength(password: str, user: Any | None = None) -> None:
        """Kiểm tra mật khẩu theo `AUTH_PASSWORD_VALIDATORS`.

        Args:
            password: Mật khẩu thô.
            user: Người dùng (để kiểm tra độ tương đồng với email/tên).

        Raises:
            ValidationError: `ACCOUNT_PASSWORD_WEAK` khi mật khẩu chưa đủ mạnh.
        """
        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            raise ValidationError(
                "Mật khẩu chưa đủ mạnh.",
                code=AccountErrorCode.ACCOUNT_PASSWORD_WEAK,
                details={"password": list(exc.messages)},
            ) from exc
