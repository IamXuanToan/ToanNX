"""Dịch vụ gửi email theo template (module System)."""

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from app.core.constants.defaults import DEFAULT_LOCALE
from app.system.constants.auth_frontend_routes import (
    EMAIL_SUBJECTS,
    EMAIL_TEMPLATE_INVITATION,
    EMAIL_TEMPLATE_PASSWORD_RESET,
    EMAIL_TEMPLATE_VERIFICATION,
    resolve_auth_locale,
)
from app.system.models.user import User

logger = logging.getLogger("app.auth.email")

# Thread pool gửi email ngầm khi EMAIL_ASYNC bật. Trên serverless, luồng nền có thể bị dừng khi response
# trả xong, nên nơi cần chắc chắn đã gửi (outbox thông báo) phải dùng `send_now`.
_email_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="auth-email-worker")


class EmailService:
    """Dựng email từ template `system/email/<name>_<lang>.{txt,html}` rồi gửi."""

    def send_now(self, *, subject: str, recipient: str, text_body: str, html_body: str | None = None) -> bool:
        """Gửi đồng bộ một email đã có nội dung.

        Args:
            subject: Tiêu đề.
            recipient: Email người nhận.
            text_body: Nội dung dạng chữ.
            html_body: Nội dung HTML (không bắt buộc).

        Returns:
            True nếu mail backend nhận thư thành công.
        """
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        if html_body:
            message.attach_alternative(html_body, "text/html")
        return self._deliver(message, recipient)

    def send_template(
        self,
        *,
        template: str,
        subject: str,
        recipient: str,
        context: dict[str, Any],
        locale: str = DEFAULT_LOCALE,
        async_send: bool | None = None,
    ) -> bool:
        """Dựng email từ template theo ngôn ngữ rồi gửi.

        Args:
            template: Tên template không kèm ngôn ngữ và đuôi (vd `password_reset`).
            subject: Tiêu đề đã dịch.
            recipient: Email người nhận.
            context: Dữ liệu cho template (`current_year` tự thêm).
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            async_send: True gửi ngầm, False gửi đồng bộ, None đọc `settings.EMAIL_ASYNC`.

        Returns:
            True nếu đã gửi hoặc đã đưa vào hàng đợi; False nếu lỗi khi dựng/gửi.
        """
        lang = resolve_auth_locale(locale)
        full_context = {"current_year": timezone.now().year, **context}
        try:
            text_body = render_to_string(f"system/email/{template}_{lang}.txt", full_context)
            html_body = render_to_string(f"system/email/{template}_{lang}.html", full_context)
            message = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
            )
            message.attach_alternative(html_body, "text/html")
        except Exception:
            logger.exception("Lỗi khi dựng email %s cho %s", template, recipient)
            return False

        should_async = async_send if async_send is not None else settings.EMAIL_ASYNC
        if should_async:
            _email_executor.submit(self._deliver, message, recipient)
            logger.info("Đã đưa email %s cho %s vào hàng đợi", template, recipient)
            return True
        return self._deliver(message, recipient)

    def send_password_reset_email(
        self,
        user: User,
        reset_url: str,
        locale: str = DEFAULT_LOCALE,
        *,
        async_send: bool | None = None,
    ) -> bool:
        """Gửi email đặt lại mật khẩu.

        Args:
            user: Người dùng yêu cầu.
            reset_url: URL tuyệt đối của trang đặt lại mật khẩu.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            async_send: Xem `send_template`.

        Returns:
            Kết quả của `send_template`.
        """
        lang = resolve_auth_locale(locale)
        return self.send_template(
            template=EMAIL_TEMPLATE_PASSWORD_RESET,
            subject=EMAIL_SUBJECTS[EMAIL_TEMPLATE_PASSWORD_RESET][lang],
            recipient=user.email,
            context={
                **self._user_context(user),
                "reset_url": reset_url,
                "timeout_minutes": max(1, settings.PASSWORD_RESET_TIMEOUT // 60),
            },
            locale=lang,
            async_send=async_send,
        )

    def send_email_verification(
        self,
        user: User,
        verification_url: str,
        locale: str = DEFAULT_LOCALE,
        *,
        timeout_hours: int = 24,
        async_send: bool | None = None,
    ) -> bool:
        """Gửi email xác minh tài khoản.

        Args:
            user: Người dùng nhận email.
            verification_url: URL tuyệt đối của trang xác minh email.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            timeout_hours: Số giờ hiệu lực của liên kết.
            async_send: Xem `send_template`.

        Returns:
            Kết quả của `send_template`.
        """
        lang = resolve_auth_locale(locale)
        return self.send_template(
            template=EMAIL_TEMPLATE_VERIFICATION,
            subject=EMAIL_SUBJECTS[EMAIL_TEMPLATE_VERIFICATION][lang],
            recipient=user.email,
            context={
                **self._user_context(user),
                "verification_url": verification_url,
                "timeout_hours": timeout_hours,
            },
            locale=lang,
            async_send=async_send,
        )

    def send_user_invitation(
        self,
        user: User,
        invitation_url: str,
        locale: str = DEFAULT_LOCALE,
        *,
        timeout_days: int = 7,
        async_send: bool | None = None,
    ) -> bool:
        """Gửi email mời người dùng thiết lập tài khoản.

        Args:
            user: Người dùng được mời.
            invitation_url: URL tuyệt đối trang thiết lập tài khoản.
            locale: Mã ngôn ngữ ('vi' hoặc 'en').
            timeout_days: Số ngày hiệu lực của liên kết.
            async_send: Xem `send_template`.

        Returns:
            Kết quả của `send_template`.
        """
        lang = resolve_auth_locale(locale)
        return self.send_template(
            template=EMAIL_TEMPLATE_INVITATION,
            subject=EMAIL_SUBJECTS[EMAIL_TEMPLATE_INVITATION][lang],
            recipient=user.email,
            context={
                **self._user_context(user),
                "invitation_url": invitation_url,
                "timeout_days": timeout_days,
            },
            locale=lang,
            async_send=async_send,
        )

    def _user_context(self, user: User) -> dict[str, Any]:
        """Dữ liệu người nhận dùng chung cho các template."""
        display_name = getattr(user, "full_name", None) or user.username or user.email
        return {"user": user, "user_display_name": display_name}

    def _deliver(self, message: EmailMultiAlternatives, recipient: str) -> bool:
        """Gửi thư qua Django mail backend, nuốt lỗi và ghi log."""
        try:
            message.send(fail_silently=False)
        except Exception:
            logger.exception("Lỗi khi gửi email cho %s", recipient)
            return False
        logger.info("Đã gửi email thành công cho %s", recipient)
        return True
