"""URL module System (/api/v1/system/...). Không có dấu `/` ở cuối, không có endpoint đăng ký.

CRUD đăng ký qua router (thao tác hàng loạt là action `bulk-update`/`bulk-delete` của ViewSet);
tài nguyên con và hành động dùng APIView, khai trước router để không bị route chi tiết `{pk}` nuốt.
"""

from django.urls import URLPattern, URLResolver, path
from rest_framework.routers import SimpleRouter

from app.system.views.accept_invitation_view import AcceptInvitationView
from app.system.views.admin_auth_session_view_set import AdminAuthSessionViewSet
from app.system.views.attachment_content_view import AttachmentContentView
from app.system.views.attachment_folder_delete_view import AttachmentFolderDeleteView
from app.system.views.attachment_folder_view_set import AttachmentFolderViewSet
from app.system.views.attachment_view_set import AttachmentViewSet
from app.system.views.attachment_visibility_view import AttachmentVisibilityView
from app.system.views.callback_view import CallbackView
from app.system.views.cleanup_view import CleanupView
from app.system.views.client_error_view import ClientErrorView
from app.system.views.csrf_view import CsrfView
from app.system.views.currency_view_set import CurrencyViewSet
from app.system.views.exchange_rate_fetch_view import ExchangeRateFetchView
from app.system.views.exchange_rate_resolve_view import ExchangeRateResolveView
from app.system.views.exchange_rate_view_set import ExchangeRateViewSet
from app.system.views.health_view import HealthView
from app.system.views.invitation_validate_view import InvitationValidateView
from app.system.views.journal_entry_view_set import JournalEntryViewSet
from app.system.views.journal_resource_view import JournalResourceView
from app.system.views.login_view import LoginView
from app.system.views.logout_all_view import LogoutAllView
from app.system.views.logout_view import LogoutView
from app.system.views.me_view import MeView
from app.system.views.notification_delivery_retry_view import NotificationDeliveryRetryView
from app.system.views.notification_delivery_view_set import NotificationDeliveryViewSet
from app.system.views.notification_dispatch_view import NotificationDispatchView
from app.system.views.notification_preference_view import NotificationPreferenceView
from app.system.views.notification_read_view import NotificationReadObjectView, NotificationReadView
from app.system.views.notification_unread_count_view import NotificationUnreadCountView
from app.system.views.notification_view import NotificationObjectView, NotificationView
from app.system.views.password_reset_confirm_view import PasswordResetConfirmView
from app.system.views.password_reset_request_view import PasswordResetRequestView
from app.system.views.password_reset_validate_token_view import PasswordResetValidateTokenView
from app.system.views.permission_view_set import PermissionViewSet
from app.system.views.public_setting_view import PublicSettingView
from app.system.views.push_device_view import PushDeviceObjectView, PushDeviceView
from app.system.views.readiness_view import ReadinessView
from app.system.views.refresh_view import RefreshView
from app.system.views.role_permission_view import RolePermissionObjectView, RolePermissionView
from app.system.views.role_view_set import RoleViewSet
from app.system.views.send_verification_email_view import SendVerificationEmailView
from app.system.views.session_view import SessionObjectView, SessionView
from app.system.views.setting_view_set import SettingViewSet
from app.system.views.social_auth_url_view import SocialAuthUrlView
from app.system.views.social_link_view import SocialLinkView
from app.system.views.social_login_view import SocialLoginView
from app.system.views.social_unlink_view import SocialUnlinkView
from app.system.views.system_announcement_view_set import SystemAnnouncementViewSet
from app.system.views.telegram_bot_check_view import TelegramBotCheckView
from app.system.views.telegram_bot_view import TelegramBotView
from app.system.views.telegram_chat_action_view import TelegramChatActionObjectView, TelegramChatActionView
from app.system.views.telegram_chat_view_set import TelegramChatViewSet
from app.system.views.user_role_view import UserRoleObjectView, UserRoleView
from app.system.views.user_social_account_view import UserSocialAccountView
from app.system.views.user_view_set import UserViewSet
from app.system.views.verify_email_view import VerifyEmailView
from app.system.views.webhook_view import WebhookView

app_name = "system"

router = SimpleRouter(trailing_slash=False)
router.register("auth/admin-sessions", AdminAuthSessionViewSet, basename="admin-sessions")
router.register("users", UserViewSet, basename="users")
router.register("roles", RoleViewSet, basename="roles")
router.register("permissions", PermissionViewSet, basename="permissions")
router.register("attachments/folders", AttachmentFolderViewSet, basename="attachment-folders")
router.register("attachments", AttachmentViewSet, basename="attachments")
router.register("telegram-chats", TelegramChatViewSet, basename="telegram-chats")
router.register("announcements", SystemAnnouncementViewSet, basename="announcements")
router.register("currencies", CurrencyViewSet, basename="currencies")
router.register("exchange-rates", ExchangeRateViewSet, basename="exchange-rates")
router.register("notification-deliveries", NotificationDeliveryViewSet, basename="notification-deliveries")
router.register("journal-entries", JournalEntryViewSet, basename="journal-entries")
router.register("settings", SettingViewSet, basename="settings")

# Đăng nhập, phiên và đặt lại mật khẩu: giữ chung tiền tố `auth/` để cookie refresh token chỉ gửi tới đây.
auth_urlpatterns: list[URLPattern | URLResolver] = [
    path("auth/csrf", CsrfView.as_view(), name="csrf"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/password-reset/request", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path(
        "auth/password-reset/validate-token",
        PasswordResetValidateTokenView.as_view(),
        name="password-reset-validate-token",
    ),
    path("auth/password-reset/confirm", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("auth/send-verification-email", SendVerificationEmailView.as_view(), name="send-verification-email"),
    path("auth/verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path("auth/invitation", InvitationValidateView.as_view(), name="invitation"),
    path("auth/accept-invitation", AcceptInvitationView.as_view(), name="accept-invitation"),
    path("auth/social/<str:provider>/url", SocialAuthUrlView.as_view(), name="social-auth-url"),
    path("auth/social/<str:provider>/login", SocialLoginView.as_view(), name="social-login"),
    path("auth/social/accounts", UserSocialAccountView.as_view(), name="user-social-accounts"),
    path("auth/social/<str:provider>/link", SocialLinkView.as_view(), name="social-link"),
    path("auth/social/<str:provider>/unlink", SocialUnlinkView.as_view(), name="social-unlink"),
    path("auth/refresh", RefreshView.as_view(), name="refresh"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/logout-all", LogoutAllView.as_view(), name="logout-all"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/sessions", SessionView.as_view(), name="sessions"),
    path("auth/sessions/<uuid:session_id>", SessionObjectView.as_view(), name="sessions-object"),
]

iam_urlpatterns: list[URLPattern | URLResolver] = [
    path("users/<uuid:user_id>/roles", UserRoleView.as_view(), name="user-roles"),
    path("users/<uuid:user_id>/roles/<uuid:role_id>", UserRoleObjectView.as_view(), name="user-roles-object"),
    path("roles/<uuid:role_id>/permissions", RolePermissionView.as_view(), name="role-permissions"),
    path(
        "roles/<uuid:role_id>/permissions/<uuid:permission_id>",
        RolePermissionObjectView.as_view(),
        name="role-permissions-object",
    ),
]

health_urlpatterns: list[URLPattern | URLResolver] = [
    path("health", HealthView.as_view(), name="health"),
    path("health/ready", ReadinessView.as_view(), name="readiness"),
    path("health/cleanup", CleanupView.as_view(), name="cleanup"),
    path("health/client-errors", ClientErrorView.as_view(), name="client-errors"),
]

urlpatterns: list[URLPattern | URLResolver] = [
    *auth_urlpatterns,
    *iam_urlpatterns,
    *health_urlpatterns,
    path(
        "attachments/folders/<uuid:pk>/delete",
        AttachmentFolderDeleteView.as_view(),
        name="attachment-folder-delete",
    ),
    path("attachments/<uuid:pk>/content", AttachmentContentView.as_view(), name="attachment-content"),
    path(
        "attachments/<uuid:pk>/visibility", AttachmentVisibilityView.as_view(), name="attachment-visibility"
    ),
    path("journal-resources", JournalResourceView.as_view(), name="journal-resources"),
    path("notifications", NotificationView.as_view(), name="notifications"),
    path(
        "notifications/unread-count", NotificationUnreadCountView.as_view(), name="notification-unread-count"
    ),
    path("notifications/read-all", NotificationReadView.as_view(), name="notification-read-all"),
    path("notifications/preferences", NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("notifications/devices", PushDeviceView.as_view(), name="notification-devices"),
    path("notifications/devices/<str:token>", PushDeviceObjectView.as_view(), name="notification-device"),
    path("notifications/dispatch", NotificationDispatchView.as_view(), name="notification-dispatch"),
    path("notifications/<uuid:pk>", NotificationObjectView.as_view(), name="notification"),
    path("notifications/<uuid:pk>/read", NotificationReadObjectView.as_view(), name="notification-read"),
    path("exchange-rates/resolve", ExchangeRateResolveView.as_view(), name="exchange-rate-resolve"),
    path("exchange-rates/fetch", ExchangeRateFetchView.as_view(), name="exchange-rate-fetch"),
    path("telegram/bot", TelegramBotView.as_view(), name="telegram-bot"),
    path("telegram/bot/check", TelegramBotCheckView.as_view(), name="telegram-bot-check"),
    path("webhooks", WebhookView.as_view(), name="webhooks"),
    path("callbacks", CallbackView.as_view(), name="callbacks"),
    path("telegram-chats/register", TelegramChatActionView.as_view(), name="telegram-register"),
    path(
        "telegram-chats/<uuid:pk>/<str:action>",
        TelegramChatActionObjectView.as_view(),
        name="telegram-chat-action",
    ),
    path(
        "notification-deliveries/<uuid:pk>/retry",
        NotificationDeliveryRetryView.as_view(),
        name="notification-delivery-retry",
    ),
    path("settings/public", PublicSettingView.as_view(), name="public-settings"),
    *router.urls,
]
