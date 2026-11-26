"""Khai báo module System (đăng ký trong `SystemConfig.ready()`)."""

from app.core.registry.callback_definition import CallbackDefinition
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.notification_event_definition import (
    NOTIFICATION_AUDIENCE_SUBSCRIBERS,
    NOTIFICATION_CHANNEL_EMAIL,
    NOTIFICATION_CHANNEL_IN_APP,
    NOTIFICATION_CHANNEL_PUSH,
    NOTIFICATION_LEVEL_ERROR,
    NOTIFICATION_LEVEL_WARNING,
    NOTIFICATION_SCOPE_SYSTEM,
    NotificationEventDefinition,
)
from app.core.registry.webhook_definition import WebhookDefinition
from app.system.constants.system_notification_event import SystemNotificationEvent as E
from app.system.permissions.announcement_permission import AnnouncementPermission
from app.system.permissions.attachment_folder_permission import AttachmentFolderPermission
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.permissions.callback_permission import CallbackPermission
from app.system.permissions.currency_permission import CurrencyPermission
from app.system.permissions.exchange_rate_permission import ExchangeRatePermission
from app.system.permissions.iam_permission import IamPermission
from app.system.permissions.journal_entry_permission import JournalEntryPermission
from app.system.permissions.notification_delivery_permission import NotificationDeliveryPermission
from app.system.permissions.notification_permission import NotificationPermission
from app.system.permissions.notification_preference_permission import NotificationPreferencePermission
from app.system.permissions.push_device_permission import PushDevicePermission
from app.system.permissions.session_permission import SessionPermission
from app.system.permissions.setting_permission import SettingPermission
from app.system.permissions.telegram_chat_permission import TelegramChatPermission
from app.system.permissions.user_permission import UserPermission
from app.system.permissions.webhook_permission import WebhookPermission

MODULE = ModuleDescriptor(
    code="system",
    name="System",
    description=(
        "Nền tảng hệ thống: tài khoản, vai trò và phân quyền, đăng nhập và phiên, thư viện file, "
        "lịch sử thay đổi và kiểm tra tình trạng hệ thống."
    ),
    version="1.0.0",
    permissions=(
        *UserPermission.all(),
        *IamPermission.all(),
        *SessionPermission.all(),
        *AttachmentPermission.all(),
        *AttachmentFolderPermission.all(),
        *JournalEntryPermission.all(),
        *SettingPermission.all(),
        *NotificationPermission.all(),
        *NotificationPreferencePermission.all(),
        *PushDevicePermission.all(),
        *TelegramChatPermission.all(),
        *NotificationDeliveryPermission.all(),
        *AnnouncementPermission.all(),
        *CurrencyPermission.all(),
        *ExchangeRatePermission.all(),
        *WebhookPermission.all(),
        *CallbackPermission.all(),
    ),
    member_permissions=(
        *AttachmentPermission.member(),
        *AttachmentFolderPermission.member(),
        *NotificationPermission.member(),
        *NotificationPreferencePermission.member(),
        *PushDevicePermission.member(),
        *TelegramChatPermission.member(),
        *NotificationDeliveryPermission.member(),
        *CurrencyPermission.member(),
        *ExchangeRatePermission.member(),
    ),
    notification_events=(
        NotificationEventDefinition(
            E.AUTH_LOGIN,
            "Có lượt đăng nhập",
            "Đăng nhập thành công bằng mật khẩu hoặc Google/GitHub.",
            default_channels=(NOTIFICATION_CHANNEL_IN_APP,),
            icon="🔐",
        ),
        NotificationEventDefinition(
            E.AUTH_NEW_DEVICE,
            "Đăng nhập từ thiết bị mới",
            "Đăng nhập từ trình duyệt/IP chưa thấy trong 30 ngày.",
            default_level=NOTIFICATION_LEVEL_WARNING,
            default_channels=(
                NOTIFICATION_CHANNEL_IN_APP,
                NOTIFICATION_CHANNEL_PUSH,
                NOTIFICATION_CHANNEL_EMAIL,
            ),
            icon="🛡️",
        ),
        NotificationEventDefinition(
            E.AUTH_PASSWORD_CHANGED,
            "Đổi mật khẩu",
            "Mật khẩu vừa được đổi hoặc đặt lại.",
            default_level=NOTIFICATION_LEVEL_WARNING,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_EMAIL),
            icon="🔑",
        ),
        NotificationEventDefinition(
            E.ANNOUNCEMENT_PUBLISHED,
            "Thông báo hệ thống",
            "Quản trị viên gửi thông báo tới mọi người hoặc theo vai trò.",
            scope=NOTIFICATION_SCOPE_SYSTEM,
            audience=NOTIFICATION_AUDIENCE_SUBSCRIBERS,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_PUSH),
            icon="📢",
        ),
        NotificationEventDefinition(
            E.DELIVERY_FAILED,
            "Gửi thông báo thất bại",
            "Một lần gửi thông báo thất bại hẳn (gom theo giờ).",
            scope=NOTIFICATION_SCOPE_SYSTEM,
            audience=NOTIFICATION_AUDIENCE_SUBSCRIBERS,
            permission="system.notification_delivery.manage_all",
            default_level=NOTIFICATION_LEVEL_ERROR,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP,),
            kind="technical",
            icon="🚨",
        ),
        NotificationEventDefinition(
            E.DATABASE_QUOTA_WARNING,
            "Dung lượng database sắp đầy",
            "Database vượt ngưỡng cảnh báo của DATABASE_MAX_BYTES (Neon free 1 GB).",
            scope=NOTIFICATION_SCOPE_SYSTEM,
            audience=NOTIFICATION_AUDIENCE_SUBSCRIBERS,
            permission="system.notification_delivery.manage_all",
            default_level=NOTIFICATION_LEVEL_WARNING,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_EMAIL),
            kind="technical",
            icon="🗄️",
        ),
        NotificationEventDefinition(
            E.STORAGE_QUOTA_WARNING,
            "Dung lượng lưu trữ sắp đầy",
            "Dung lượng R2 vượt ngưỡng cảnh báo.",
            scope=NOTIFICATION_SCOPE_SYSTEM,
            audience=NOTIFICATION_AUDIENCE_SUBSCRIBERS,
            permission="system.attachment.manage_all",
            default_level=NOTIFICATION_LEVEL_WARNING,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_EMAIL),
            kind="technical",
            icon="💾",
        ),
    ),
    webhooks=(
        WebhookDefinition(
            code="system.notification_dispatch",
            name="Gửi thông báo đang chờ (QStash + cron)",
            provider="Upstash QStash / cron-job.org",
            path="/system/notifications/dispatch",
            description=(
                "Request nghiệp vụ chỉ ghi outbox thông báo; endpoint này gửi push/email/Telegram ở "
                "lượt function riêng. QStash gọi ngay sau khi có thông báo (và hẹn trễ cho lần thử lại); "
                "cron ngoài là lưới an toàn, không có việc thì trả về ngay mà không chạm DB."
            ),
            auth=(
                "QStash: header Upstash-Signature (JWT HS256, QSTASH_CURRENT/NEXT_SIGNING_KEY). "
                "Cron: Authorization: Bearer <CRON_SECRET>. Sai cả hai → 404."
            ),
            setup=(
                "Vercel → project backend → Storage → Upstash QStash: integration tạo QSTASH_URL, "
                "QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY. "
                "Không cần tạo schedule trên QStash.",
                "cron-job.org: POST URL ở trên mỗi 10 phút, header Authorization: Bearer <CRON_SECRET>.",
            ),
        ),
        WebhookDefinition(
            code="system.telegram_webhook",
            name="Webhook Bot Telegram chung",
            provider="Telegram Bot API",
            path="/system/telegram/webhook",
            description=(
                "Nhận sự kiện `/start <code>`, `my_chat_member` để tự kích hoạt TelegramChat theo user "
                "và chuyển tiếp tin nhắn Trợ lý AI sang module xử lý."
            ),
            auth=(
                "Header X-Telegram-Bot-Api-Secret-Token dẫn xuất salted_hmac từ DJANGO_SECRET_KEY + "
                "sha256(TELEGRAM_BOT_TOKEN). Sai hoặc chưa cấu hình bot → 404."
            ),
            setup=(
                "Đặt TELEGRAM_BOT_TOKEN (và tùy chọn TELEGRAM_BOT_USERNAME) ở biến môi trường backend.",
                (
                    "Vào Admin → Hồ sơ → Thông báo (quyền system.setting.update) hoặc chạy command "
                    "`sync_telegram_webhook` để đăng ký webhook tự động."
                ),
            ),
        ),
    ),
    callbacks=(
        CallbackDefinition(
            code="system.google_oauth",
            name="Đăng nhập / liên kết Google",
            provider="Google",
            path="/auth/callback/google",
            description="Google chuyển người dùng về đây sau khi đồng ý đăng nhập hoặc liên kết tài khoản.",
            setup=(
                "Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application).",
                "Authorized redirect URIs: thêm URL ở trên (mỗi domain FE một dòng, kể cả localhost).",
                "Chép Client ID/Secret vào GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET.",
            ),
            setting="GOOGLE_OAUTH_CLIENT_ID",
        ),
        CallbackDefinition(
            code="system.github_oauth",
            name="Đăng nhập / liên kết GitHub",
            provider="GitHub",
            path="/auth/callback/github",
            description="GitHub chuyển người dùng về đây sau khi đồng ý đăng nhập hoặc liên kết tài khoản.",
            setup=(
                "GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.",
                "Authorization callback URL: URL ở trên (mỗi OAuth App một URL; mỗi domain một app).",
                "Chép Client ID/Secret vào GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET.",
            ),
            setting="GITHUB_OAUTH_CLIENT_ID",
        ),
    ),
    cleanup_tasks=(
        "app.system.tasks.purge_expired_auth.purge_expired_auth",
        "app.system.tasks.purge_journal.purge_journal",
        "app.system.tasks.purge_deleted_files.purge_deleted_files",
        "app.system.tasks.dispatch_notifications.dispatch_notifications",
        "app.system.tasks.purge_notifications.purge_notifications",
        "app.system.tasks.check_database_size.check_database_size",
    ),
)
