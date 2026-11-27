"""Khai báo module Workspace (đăng ký trong `WorkspaceConfig.ready()`)."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.notification_event_definition import (
    NOTIFICATION_AUDIENCE_OWNER,
    NOTIFICATION_CHANNEL_IN_APP,
    NOTIFICATION_CHANNEL_PUSH,
    NOTIFICATION_CHANNEL_TELEGRAM,
    NOTIFICATION_LEVEL_INFO,
    NOTIFICATION_LEVEL_WARNING,
    NOTIFICATION_SCOPE_PERSONAL,
    NotificationEventDefinition,
)
from app.core.registry.webhook_definition import WebhookDefinition
from app.workspace.constants.workspace_notification_event import WorkspaceNotificationEvent as E
from app.workspace.permissions.asset_permission import AssetPermission
from app.workspace.permissions.asset_warranty_claim_permission import AssetWarrantyClaimPermission
from app.workspace.permissions.assistant_config_permission import AssistantConfigPermission
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.permissions.subscription_payment_permission import SubscriptionPaymentPermission
from app.workspace.permissions.subscription_permission import SubscriptionPermission
from app.workspace.permissions.vault_item_permission import VaultItemPermission
from app.workspace.permissions.workspace_calendar_permission import WorkspaceCalendarPermission
from app.workspace.permissions.workspace_dashboard_permission import WorkspaceDashboardPermission
from app.workspace.permissions.workspace_setting_permission import WorkspaceSettingPermission

MODULE = ModuleDescriptor(
    code="workspace",
    name="Workspace",
    description=(
        "Trợ lý cá nhân: thiết bị & bảo hành, gói định kỳ & lịch sử gia hạn, két sắt bí mật, "
        "nhắc việc, lịch tổng hợp và trợ lý AI hai chiều qua Web/Telegram."
    ),
    version="1.0.0",
    dependencies=("system", "finance", "utilities", "novel"),
    permissions=(
        *AssetPermission.all(),
        *AssetWarrantyClaimPermission.all(),
        *SubscriptionPermission.all(),
        *SubscriptionPaymentPermission.all(),
        *VaultItemPermission.all(),
        *ReminderPermission.all(),
        *WorkspaceSettingPermission.all(),
        *AssistantPermission.all(),
        *AssistantConfigPermission.all(),
        *WorkspaceDashboardPermission.all(),
        *WorkspaceCalendarPermission.all(),
    ),
    member_permissions=(
        *AssetPermission.member(),
        *AssetWarrantyClaimPermission.member(),
        *SubscriptionPermission.member(),
        *SubscriptionPaymentPermission.member(),
        *VaultItemPermission.member(),
        *ReminderPermission.member(),
        *WorkspaceSettingPermission.member(),
        *AssistantPermission.member(),
        *WorkspaceDashboardPermission.member(),
        *WorkspaceCalendarPermission.member(),
    ),
    notification_events=(
        NotificationEventDefinition(
            E.REMINDER_DUE,
            "Nhắc việc tới hạn",
            "Nhắc việc cá nhân đến giờ thực hiện.",
            scope=NOTIFICATION_SCOPE_PERSONAL,
            audience=NOTIFICATION_AUDIENCE_OWNER,
            permission=ReminderPermission.READ.code,
            default_level=NOTIFICATION_LEVEL_INFO,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_PUSH),
            kind="business",
            icon="⏰",
        ),
        NotificationEventDefinition(
            E.DIGEST_DAILY,
            "Tóm tắt công việc hàng ngày",
            "Bản tin tổng hợp việc, gia hạn và bảo hành thiết bị theo khung giờ cấu hình.",
            scope=NOTIFICATION_SCOPE_PERSONAL,
            audience=NOTIFICATION_AUDIENCE_OWNER,
            permission=WorkspaceSettingPermission.READ.code,
            default_level=NOTIFICATION_LEVEL_INFO,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_TELEGRAM),
            kind="business",
            icon="📋",
        ),
        NotificationEventDefinition(
            E.WARRANTY_EXPIRING,
            "Thiết bị sắp hết bảo hành",
            "Cảnh báo trước khi thiết bị cá nhân hết hạn bảo hành.",
            scope=NOTIFICATION_SCOPE_PERSONAL,
            audience=NOTIFICATION_AUDIENCE_OWNER,
            permission=AssetPermission.READ.code,
            default_level=NOTIFICATION_LEVEL_WARNING,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_PUSH),
            kind="business",
            icon="🛡️",
        ),
        NotificationEventDefinition(
            E.SUBSCRIPTION_RENEWING,
            "Dịch vụ sắp tới hạn gia hạn",
            "Nhắc thanh toán hoặc rà soát dịch vụ định kỳ trước ngày gia hạn.",
            scope=NOTIFICATION_SCOPE_PERSONAL,
            audience=NOTIFICATION_AUDIENCE_OWNER,
            permission=SubscriptionPermission.READ.code,
            default_level=NOTIFICATION_LEVEL_WARNING,
            default_channels=(NOTIFICATION_CHANNEL_IN_APP, NOTIFICATION_CHANNEL_PUSH),
            kind="business",
            icon="💳",
        ),
    ),
    webhooks=(
        WebhookDefinition(
            code="workspace.cron_tick",
            name="Cron Workspace Tick (Alerts W4)",
            provider="cron-job.org / Upstash QStash",
            path="/workspace/cron/tick",
            description=(
                "Chạy định kỳ mỗi 15–30 phút: đường W4 chỉ chạm DB khi Redis alerts_next_due tới hạn."
            ),
            auth="Header Authorization: Bearer <CRON_SECRET> hoặc Upstash-Signature. Sai cả hai → 404.",
            setup=(
                "Tạo job trên cron-job.org gọi POST URL ở trên mỗi 15 hoặc 30 phút.",
                "Gắn header Authorization: Bearer <CRON_SECRET> khớp cấu hình backend.",
            ),
        ),
        WebhookDefinition(
            code="workspace.cron_dispatch_due",
            name="Gửi Digest / Reminder đúng giờ (QStash)",
            provider="Upstash QStash",
            path="/workspace/cron/dispatch-due",
            description="Endpoint hẹn trễ bởi QStash để phát Digest và Reminder đúng phút.",
            auth="Header Upstash-Signature hợp lệ hoặc Authorization: Bearer <CRON_SECRET>. Sai → 404.",
            setup=("Tự động gọi bởi QStash (Upstash-Delay), không cần tạo schedule thủ công.",),
        ),
        WebhookDefinition(
            code="workspace.telegram_async",
            name="Xử lý Trợ lý AI Telegram bất đồng bộ (QStash 1-hop)",
            provider="Upstash QStash",
            path="/workspace/assistant/telegram-process",
            description="Tách bước gọi xKiro LLM ra khỏi webhook Telegram để webhook trả 200 OK < 200ms.",
            auth="Header Upstash-Signature hoặc Authorization: Bearer <CRON_SECRET>. Sai → 404.",
            setup=("Tự động kích hoạt bởi hook Telegram của module system khi QSTASH_TOKEN được bật.",),
        ),
    ),
    cleanup_tasks=(
        "app.workspace.tasks.purge_old_assistant_history.purge_old_assistant_history",
        "app.workspace.tasks.refresh_cron_schedules.refresh_cron_schedules",
    ),
)
