"""Thông báo bảo mật tài khoản: có lượt đăng nhập, đăng nhập từ thiết bị mới, đổi mật khẩu.

Gọi sau khi mở phiên/đổi mật khẩu; lỗi thông báo không bao giờ ảnh hưởng đăng nhập (`notify` tự nuốt lỗi).
"""

from datetime import timedelta
from typing import Any

from django.utils import timezone

from app.system.constants.notification_defaults import NEW_DEVICE_LOOKBACK_DAYS
from app.system.constants.system_notification_event import SystemNotificationEvent as Event
from app.system.models.auth_session import AuthSession
from app.system.repositories.auth_session_repository import AuthSessionRepository
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload
from app.system.utils.user_agent import describe_user_agent

SESSIONS_PATH = "/portal/profile?profileTab=security"
USER_AGENT_MAX = 120


class LoginNotificationService:
    """Thiết bị mới = chưa có phiên cùng user agent + IP trong 30 ngày (lần đăng nhập đầu tiên không tính)."""

    def __init__(
        self,
        auth_session_repository: AuthSessionRepository | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.auth_session_repository = auth_session_repository or AuthSessionRepository()
        self.notification_service = notification_service or NotificationService()

    def notify_login(self, user: Any, session: AuthSession) -> None:
        """Phát `system.auth.login` và (nếu thiết bị mới) `system.auth.new_device`."""
        # Nhãn ngắn ("Chrome trên Windows") thay vì cả chuỗi User-Agent: popup/Telegram đọc được ngay.
        device = describe_user_agent(session.user_agent)[:USER_AGENT_MAX]
        ip = session.ip_address or "?"
        account = user.email or user.get_username()
        details = (("👤 Tài khoản", account), ("💻 Thiết bị", device), ("🌐 IP", ip))
        self.notification_service.notify(
            Event.AUTH_LOGIN,
            recipient=user,
            dedup_key=f"session:{session.pk}",
            payload=NotificationPayload(
                title="Có lượt đăng nhập mới",
                body=f"{device} · IP {ip}",
                link=SESSIONS_PATH,
                message_key="system.notifications.events.login",
                params={"device": device, "ip": ip},
                details=details,
            ),
        )
        since = timezone.now() - timedelta(days=NEW_DEVICE_LOOKBACK_DAYS)
        known = self.auth_session_repository.has_recent_device(
            user.pk, session.user_agent, session.ip_address, since, session.pk
        )
        if known or not self.auth_session_repository.has_any_before(user.pk, session.pk):
            return
        self.notification_service.notify(
            Event.AUTH_NEW_DEVICE,
            recipient=user,
            dedup_key=f"session:{session.pk}",
            payload=NotificationPayload(
                title="Đăng nhập từ thiết bị mới",
                body=f"{device} · IP {ip}\nKhông phải bạn? Đổi mật khẩu và đăng xuất phiên lạ.",
                link=SESSIONS_PATH,
                message_key="system.notifications.events.newDevice",
                params={"device": device, "ip": ip},
                details=(
                    *details,
                    ("⚠️ Lưu ý", "Không phải bạn? Đổi mật khẩu ngay và đăng xuất các phiên lạ."),
                ),
            ),
        )

    def notify_password_changed(self, user: Any) -> None:
        """Phát `system.auth.password_changed`."""
        now = timezone.now()
        self.notification_service.notify(
            Event.AUTH_PASSWORD_CHANGED,
            recipient=user,
            dedup_key=f"{now:%Y%m%d%H%M%S}",
            payload=NotificationPayload(
                title="Mật khẩu vừa được đổi",
                body="Nếu không phải bạn, hãy đặt lại mật khẩu ngay.",
                message_key="system.notifications.events.passwordChanged",
                details=(
                    ("👤 Tài khoản", user.email or user.get_username()),
                    ("⚠️ Lưu ý", "Nếu không phải bạn, hãy đặt lại mật khẩu và đăng xuất mọi phiên ngay."),
                ),
            ),
        )
