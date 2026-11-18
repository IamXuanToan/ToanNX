"""Nghiệp vụ quên mật khẩu và đặt lại mật khẩu."""

import logging

from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.http import HttpRequest
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.validation_error import ValidationError
from app.modules.account.models.user import User
from app.modules.account.services.user_service import UserService
from app.modules.account.signals import user_credentials_changed
from app.modules.account.validators.password_validator import PasswordValidator
from app.modules.authentication.services.email_service import EmailService
from app.modules.authentication.utils.frontend_url import get_frontend_origin

logger = logging.getLogger("app.auth.password_reset")


class PasswordResetService:
    """Điều phối quy trình yêu cầu, xác thực token và cập nhật mật khẩu mới."""

    def __init__(
        self,
        email_service: type[EmailService] | None = None,
        user_service: UserService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            email_service: Lớp service email (cho phép mock khi test).
            user_service: Service quản lý tài khoản người dùng.
        """
        self.email_service = email_service or EmailService
        self.user_service = user_service or UserService()

    def build_reset_url(self, request: HttpRequest, uidb64: str, token: str, locale: str = "vi") -> str:
        """Tạo đường dẫn đặt lại mật khẩu dẫn về Frontend Next.js.

        Tự động nhận diện origin của frontend từ request để hoạt động chính xác
        với nhiều site/domain frontend khác nhau (không hardcode domain).

        Args:
            request: HttpRequest hiện tại.
            uidb64: Base64 mã định danh user.
            token: Token HMAC của Django.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').

        Returns:
            Đường dẫn tuyệt đối.
        """
        lang = "en" if locale == "en" else "vi"
        frontend_origin = get_frontend_origin(request)
        path = f"/{lang}/reset-password" if lang == "en" else f"/{lang}/dat-lai-mat-khau"
        return f"{frontend_origin}{path}?uid={uidb64}&token={token}"

    def request_password_reset(
        self,
        request: HttpRequest,
        email: str,
        locale: str = "vi",
        *,
        async_send: bool | None = None,
    ) -> str:
        """Yêu cầu đặt lại mật khẩu với cơ chế chống user enumeration.

        Luôn trả về cùng một thông báo thành công dù email có tồn tại hay không.
        Gửi email bất đồng bộ ngầm để không chặn luồng xử lý web của người dùng.

        Args:
            request: HttpRequest.
            email: Địa chỉ email người dùng nhập.
            locale: Ngôn ngữ giao diện của client.
            async_send: Có gửi bất đồng bộ hay không (None = theo cấu hình).

        Returns:
            Thông báo hướng dẫn người dùng.
        """
        normalized_email = email.strip().lower()
        user = self.user_service.find_by_identifier(normalized_email)

        if user and user.is_active:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = self.build_reset_url(request, uidb64, token, locale=locale)
            self.email_service.send_password_reset_email(
                user,
                reset_url,
                locale=locale,
                async_send=async_send,
            )
        else:
            logger.info(
                "Yêu cầu đặt lại mật khẩu cho email không tồn tại hoặc tài khoản bị khóa: %s",
                normalized_email,
            )

        return "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút."

    def validate_reset_token(self, uidb64: str, token: str) -> User:
        """Kiểm tra token đặt lại mật khẩu có hợp lệ và còn hạn hay không.

        Args:
            uidb64: Base64 của user ID.
            token: Token xác thực.

        Returns:
            User đối ứng nếu token hợp lệ.

        Raises:
            ValidationError: Nếu token sai, hết hạn hoặc user không tồn tại / đã khóa.
        """
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = self.user_service.find_by_id(uid)
        except (ValueError, TypeError, OverflowError) as exc:
            raise ValidationError(
                "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
                code=ErrorCode.AUTH_PASSWORD_RESET_TOKEN_INVALID,
            ) from exc

        if not user or not user.is_active or not default_token_generator.check_token(user, token):
            raise ValidationError(
                "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
                code=ErrorCode.AUTH_PASSWORD_RESET_TOKEN_INVALID,
            )

        return user

    def confirm_password_reset(self, uidb64: str, token: str, new_password: str) -> str:
        """Xác nhận và đặt lại mật khẩu mới.

        Sau khi đổi mật khẩu, toàn bộ phiên đăng nhập cũ sẽ bị thu hồi.

        Args:
            uidb64: Base64 của user ID.
            token: Token xác thực.
            new_password: Mật khẩu mới.

        Returns:
            Thông báo thành công.

        Raises:
            ValidationError: Mật khẩu yếu hoặc token không hợp lệ.
        """
        user = self.validate_reset_token(uidb64, token)
        PasswordValidator.validate_strength(new_password, user=user)

        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=["password", "updated_at"])

            transaction.on_commit(
                lambda: user_credentials_changed.send(
                    sender=User,
                    user=user,
                    reason="password_reset",
                )
            )

        logger.info("Người dùng %s đã đặt lại mật khẩu thành công", user.email)
        return "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới."
