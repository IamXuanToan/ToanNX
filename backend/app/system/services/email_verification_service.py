"""Nghiệp vụ xác minh địa chỉ email (module System)."""

import logging

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import transaction
from django.http import HttpRequest
from django.utils import timezone

from app.core.exceptions.validation_error import ValidationError
from app.system.constants.account_error_code import AccountErrorCode
from app.system.models.user import User
from app.system.services.email_service import EmailService
from app.system.services.user_service import UserService
from app.system.utils.frontend_url import get_frontend_origin

logger = logging.getLogger("app.auth.email_verification")

TOKEN_MAX_AGE_SECONDS = 86400  # 24 giờ
SIGNER_SALT = "email-verification"


class EmailVerificationService:
    """Điều phối quy trình gửi thư xác minh và kích hoạt trạng thái xác minh email."""

    def __init__(
        self,
        email_service: EmailService | None = None,
        user_service: UserService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            email_service: Service gửi email.
            user_service: Service quản lý người dùng.
        """
        self.email_service = email_service or EmailService()
        self.user_service = user_service or UserService()
        self.signer = TimestampSigner(salt=SIGNER_SALT)

    def generate_token(self, user: User) -> str:
        """Sinh token xác minh có chữ ký bảo mật và dấu thời gian.

        Args:
            user: Người dùng cần xác minh.

        Returns:
            Chuỗi token an toàn.
        """
        payload = f"{user.pk}:{user.email}:{user.is_verified}"
        return self.signer.sign(payload)

    def build_verification_url(self, request: HttpRequest, token: str, locale: str = "vi") -> str:
        """Tạo URL xác minh dẫn về Frontend Next.js.

        Args:
            request: HttpRequest hiện tại.
            token: Token xác minh.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').

        Returns:
            URL tuyệt đối.
        """
        lang = "en" if locale == "en" else "vi"
        frontend_origin = get_frontend_origin(request)
        path = f"/{lang}/verify-email"
        return f"{frontend_origin}{path}?token={token}"

    def send_verification_email(
        self,
        request: HttpRequest,
        user: User,
        locale: str = "vi",
        *,
        async_send: bool | None = None,
    ) -> str:
        """Gửi email xác minh cho người dùng.

        Args:
            request: HttpRequest.
            user: Người dùng cần xác minh.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            async_send: Có gửi bất đồng bộ hay không.

        Returns:
            Thông báo hướng dẫn người dùng.

        Raises:
            ValidationError: Nếu email đã được xác minh trước đó.
        """
        if user.is_verified:
            raise ValidationError(
                "Email này đã được xác minh trước đó.",
                code=AccountErrorCode.ACCOUNT_EMAIL_ALREADY_VERIFIED,
            )

        token = self.generate_token(user)
        verification_url = self.build_verification_url(request, token, locale=locale)
        self.email_service.send_email_verification(
            user,
            verification_url,
            locale=locale,
            timeout_hours=TOKEN_MAX_AGE_SECONDS // 3600,
            async_send=async_send,
        )

        return "Liên kết xác minh đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư."

    def verify_email(self, token: str) -> User:
        """Xác thực token và đánh dấu email đã được xác minh.

        Args:
            token: Token từ liên kết xác minh.

        Returns:
            User đã được xác minh.

        Raises:
            ValidationError: Khi token hết hạn hoặc không hợp lệ / đã dùng.
        """
        try:
            raw_payload = self.signer.unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
            parts = raw_payload.split(":")
            if len(parts) != 3:
                raise BadSignature("Payload sai định dạng")
            user_id, email, was_verified_str = parts
        except SignatureExpired as exc:
            logger.warning("Token xác minh email đã hết hạn")
            raise ValidationError(
                "Liên kết xác minh email đã hết hạn. Vui lòng yêu cầu liên kết mới.",
                code=AccountErrorCode.ACCOUNT_EMAIL_VERIFICATION_TOKEN_EXPIRED,
            ) from exc
        except (BadSignature, ValueError) as exc:
            logger.warning("Token xác minh email không hợp lệ")
            raise ValidationError(
                "Liên kết xác minh email không hợp lệ hoặc đã được sử dụng.",
                code=AccountErrorCode.ACCOUNT_EMAIL_VERIFICATION_TOKEN_INVALID,
            ) from exc

        user = self.user_service.find_by_id(user_id)
        if not user or not user.is_active or user.email.lower() != email.strip().lower():
            raise ValidationError(
                "Liên kết xác minh email không hợp lệ hoặc đã được sử dụng.",
                code=AccountErrorCode.ACCOUNT_EMAIL_VERIFICATION_TOKEN_INVALID,
            )

        # Nếu token được sinh lúc user chưa verify nhưng giờ user đã verify -> token coi như đã dùng
        if was_verified_str.lower() == "true" or user.is_verified:
            return user

        with transaction.atomic():
            user.is_verified = True
            user.email_verified_at = timezone.now()
            user.save(update_fields=["is_verified", "email_verified_at", "updated_at"])

        logger.info("Người dùng %s đã xác minh email thành công", user.email)
        return user
