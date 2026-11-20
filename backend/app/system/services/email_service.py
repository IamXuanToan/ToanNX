"""Dịch vụ gửi email cho phần xác thực (module System)."""

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from app.system.models.user import User

logger = logging.getLogger("app.auth.email")

# Thread pool worker xử lý gửi email bất đồng bộ không chặn luồng web
_email_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="auth-email-worker")


class EmailService:
    """Xử lý gửi email xác thực (đặt lại mật khẩu, thông báo bảo mật)."""

    @classmethod
    def _execute_send(cls, message: EmailMultiAlternatives, recipient: str) -> bool:
        """Thực hiện gửi email thật qua Django mail backend.

        Args:
            message: Thư điện tử đã dựng.
            recipient: Địa chỉ email người nhận.

        Returns:
            True nếu gửi thành công.
        """
        try:
            message.send(fail_silently=False)
            logger.info("Đã gửi email thành công cho %s", recipient)
            return True
        except Exception:
            logger.exception("Lỗi khi gửi email cho %s", recipient)
            return False

    @classmethod
    def send_password_reset_email(
        cls,
        user: User,
        reset_url: str,
        locale: str = "vi",
        *,
        async_send: bool | None = None,
    ) -> bool:
        """Gửi email đặt lại mật khẩu với liên kết an toàn.

        Args:
            user: Người dùng yêu cầu.
            reset_url: URL tuyệt đối của trang đặt lại mật khẩu.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            async_send: True để gửi qua worker thread ngầm, False để gửi đồng bộ.
                Nếu là None, đọc từ settings.EMAIL_ASYNC (mặc định True).

        Returns:
            True nếu đã lập lịch hoặc gửi thành công, False nếu thất bại khi chuẩn bị.
        """
        lang = "en" if locale == "en" else "vi"
        timeout_minutes = max(1, settings.PASSWORD_RESET_TIMEOUT // 60)
        display_name = getattr(user, "full_name", None) or user.username or user.email

        context: dict[str, Any] = {
            "user": user,
            "user_display_name": display_name,
            "reset_url": reset_url,
            "timeout_minutes": timeout_minutes,
        }

        subject = "Reset your TOANNX password" if lang == "en" else "Đặt lại mật khẩu tài khoản TOANNX"
        text_template = f"system/email/password_reset_{lang}.txt"
        html_template = f"system/email/password_reset_{lang}.html"

        try:
            text_body = render_to_string(text_template, context)
            html_body = render_to_string(html_template, context)

            message = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            message.attach_alternative(html_body, "text/html")

            should_async = async_send if async_send is not None else getattr(settings, "EMAIL_ASYNC", True)

            if should_async:
                _email_executor.submit(cls._execute_send, message, user.email)
                logger.info("Đã đưa tác vụ gửi email cho %s vào hàng đợi bất đồng bộ", user.email)
                return True

            return cls._execute_send(message, user.email)
        except Exception:
            logger.exception("Lỗi khi chuẩn bị email đặt lại mật khẩu cho %s", user.email)
            return False
