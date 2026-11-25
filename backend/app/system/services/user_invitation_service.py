"""Nghiệp vụ mời người dùng và kích hoạt tài khoản lần đầu (module System)."""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import transaction
from django.http import HttpRequest
from django.utils import timezone

from app.core.constants.defaults import DEFAULT_LOCALE
from app.core.exceptions.validation_error import ValidationError
from app.system.constants.account_error_code import AccountErrorCode
from app.system.constants.auth_frontend_routes import AUTH_INVITATION_PATH_SEGMENT, resolve_auth_locale
from app.system.models.user import User
from app.system.repositories.user_repository import UserRepository
from app.system.services.email_service import EmailService
from app.system.types.auth_result import AuthResult
from app.system.utils.frontend_url import get_frontend_origin
from app.system.validators.password_validator import PasswordValidator

if TYPE_CHECKING:
    from app.system.services.auth_service import AuthService

logger = logging.getLogger("app.auth.user_invitation")

INVITATION_MAX_AGE_SECONDS = 7 * 86400  # 7 ngày
SIGNER_SALT = "user-invitation"
USERNAME_REGEX = re.compile(r"^[\w.@+-]+$")


class UserInvitationService:
    """Điều phối quy trình gửi thư mời tham gia và kích hoạt tài khoản lần đầu."""

    def __init__(
        self,
        email_service: EmailService | None = None,
        user_repository: UserRepository | None = None,
        auth_service: AuthService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            email_service: Service gửi email.
            user_repository: Repository người dùng.
            auth_service: Service xác thực và tạo phiên đăng nhập.
        """
        self.email_service = email_service or EmailService()
        self.user_repository = user_repository or UserRepository()
        self._auth_service = auth_service
        self.signer = TimestampSigner(salt=SIGNER_SALT)

    def generate_token(self, user: User) -> str:
        """Sinh token mời tham gia có chữ ký bảo mật và dấu thời gian.

        Args:
            user: Người dùng được mời.

        Returns:
            Chuỗi token an toàn.
        """
        has_usable = user.has_usable_password()
        payload = f"{user.pk}:{user.email}:{has_usable}"
        return self.signer.sign(payload)

    def build_invitation_url(self, request: HttpRequest, token: str, locale: str = DEFAULT_LOCALE) -> str:
        """Tạo URL mời dẫn về Frontend Next.js.

        Args:
            request: HttpRequest hiện tại.
            token: Token mời.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').

        Returns:
            URL tuyệt đối.
        """
        lang = resolve_auth_locale(locale)
        frontend_origin = get_frontend_origin(request)
        path = f"/{lang}/{AUTH_INVITATION_PATH_SEGMENT}"
        return f"{frontend_origin}{path}?token={token}"

    def send_invitation_email(
        self,
        request: HttpRequest,
        user: User,
        locale: str = DEFAULT_LOCALE,
        *,
        async_send: bool | None = None,
    ) -> str:
        """Gửi email mời tham gia hệ thống cho người dùng.

        Args:
            request: HttpRequest.
            user: Người dùng được mời.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            async_send: Có gửi bất đồng bộ hay không.

        Returns:
            Thông báo hướng dẫn.
        """
        token = self.generate_token(user)
        invitation_url = self.build_invitation_url(request, token, locale=locale)
        self.email_service.send_user_invitation(
            user,
            invitation_url,
            locale=locale,
            timeout_days=INVITATION_MAX_AGE_SECONDS // 86400,
            async_send=async_send,
        )

        return "Thư mời đã được gửi thành công đến người dùng."

    def validate_invitation_token(self, token: str) -> User:
        """Kiểm tra token lời mời có hợp lệ và chưa được sử dụng hay không.

        Args:
            token: Chuỗi token mời.

        Returns:
            User đối ứng nếu token hợp lệ.

        Raises:
            ValidationError: Khi token hết hạn, không hợp lệ hoặc đã dùng.
        """
        try:
            raw_payload = self.signer.unsign(token, max_age=INVITATION_MAX_AGE_SECONDS)
            parts = raw_payload.split(":")
            if len(parts) != 3:
                raise BadSignature("Payload sai định dạng")
            user_id, email, was_usable_str = parts
        except SignatureExpired as exc:
            logger.warning("Token lời mời tham gia đã hết hạn")
            raise ValidationError(
                "Lời mời tham gia hệ thống đã hết hạn. Vui lòng liên hệ quản trị viên để nhận lời mời mới.",
                code=AccountErrorCode.ACCOUNT_INVITATION_TOKEN_EXPIRED,
            ) from exc
        except (BadSignature, ValueError) as exc:
            logger.warning("Token lời mời tham gia không hợp lệ")
            raise ValidationError(
                "Lời mời tham gia không hợp lệ hoặc đã được sử dụng.",
                code=AccountErrorCode.ACCOUNT_INVITATION_TOKEN_INVALID,
            ) from exc

        user = self.user_repository.find_by_id(user_id)
        if not user or not user.is_active or user.email.lower() != email.strip().lower():
            raise ValidationError(
                "Lời mời tham gia không hợp lệ hoặc đã được sử dụng.",
                code=AccountErrorCode.ACCOUNT_INVITATION_TOKEN_INVALID,
            )

        # Nếu user đã có mật khẩu usable (đã thiết lập tài khoản xong trước đó)
        if was_usable_str.lower() == "true" or user.has_usable_password():
            raise ValidationError(
                "Lời mời tham gia không hợp lệ hoặc đã được sử dụng.",
                code=AccountErrorCode.ACCOUNT_INVITATION_TOKEN_INVALID,
            )

        return user

    def accept_invitation(
        self,
        token: str,
        full_name: str,
        username: str | None,
        password: str,
        request: HttpRequest,
    ) -> AuthResult:
        """Thiết lập mật khẩu lần đầu, hoàn tất thông tin và đăng nhập luôn vào hệ thống.

        Args:
            token: Token lời mời.
            full_name: Họ và tên đầy đủ.
            username: Tên người dùng tùy chọn hoặc bắt buộc.
            password: Mật khẩu mới.
            request: Request HTTP.

        Returns:
            AuthResult chứa thông tin user, quyền và token phiên đăng nhập.

        Raises:
            ValidationError: Dữ liệu không hợp lệ hoặc token sai.
        """
        user = self.validate_invitation_token(token)

        # Validate họ tên
        clean_full_name = full_name.strip()
        if not clean_full_name:
            raise ValidationError(
                "Họ và tên không được để trống.",
                details={"full_name": ["Trường này là bắt buộc."]},
            )

        # Validate username nếu có truyền
        clean_username: str | None = None
        if username and username.strip():
            clean_username = username.strip()
            if not USERNAME_REGEX.match(clean_username):
                raise ValidationError(
                    "Tên người dùng chỉ được chứa chữ cái, số và @/./+/-/_.",
                    details={"username": ["Định dạng không hợp lệ."]},
                )
            if len(clean_username) > 150:
                raise ValidationError(
                    "Tên người dùng không được vượt quá 150 ký tự.",
                    details={"username": ["Độ dài tối đa 150 ký tự."]},
                )

            existing = self.user_repository.find_by_username(clean_username)
            if existing and existing.pk != user.pk:
                raise ValidationError(
                    "Tên người dùng đã được sử dụng, vui lòng chọn tên khác.",
                    code=AccountErrorCode.ACCOUNT_USERNAME_EXISTS,
                    details={"username": ["Tên người dùng đã tồn tại."]},
                )

        # Validate độ mạnh mật khẩu
        user.full_name = clean_full_name
        if clean_username:
            user.username = clean_username
        PasswordValidator.validate_strength(password, user=user)

        with transaction.atomic():
            user.set_password(password)
            user.is_verified = True
            user.email_verified_at = timezone.now()
            user.save(
                update_fields=[
                    "full_name",
                    "username",
                    "password",
                    "is_verified",
                    "email_verified_at",
                    "updated_at",
                ]
            )

            # Tự động tạo phiên đăng nhập luôn cho người dùng
            if self._auth_service is not None:
                auth_service = self._auth_service
            else:
                from app.system.services.auth_service import AuthService  # noqa: PLC0415

                auth_service = AuthService()
            auth_result = auth_service.create_session_for_user(request=request, user=user)

        logger.info("Người dùng %s đã kích hoạt tài khoản thành công qua lời mời", user.email)
        return auth_result
