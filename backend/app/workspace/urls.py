"""URL module Workspace (/api/v1/workspace/...). Mọi `APIView` khai báo trước `router.urls`."""

from django.urls import URLPattern, URLResolver, path
from rest_framework.routers import SimpleRouter

from app.workspace.views.asset_view_set import AssetViewSet
from app.workspace.views.asset_warranty_claim_view_set import AssetWarrantyClaimViewSet
from app.workspace.views.assistant_chat_view import AssistantChatView
from app.workspace.views.assistant_conversation_messages_view import (
    AssistantConversationMessagesView,
)
from app.workspace.views.assistant_conversation_view_set import AssistantConversationViewSet
from app.workspace.views.monitor_incident_view_set import MonitorIncidentViewSet
from app.workspace.views.monitor_target_view_set import MonitorTargetViewSet
from app.workspace.views.reminder_view_set import ReminderViewSet
from app.workspace.views.subscription_payment_view_set import SubscriptionPaymentViewSet
from app.workspace.views.subscription_view_set import SubscriptionViewSet
from app.workspace.views.telegram_assistant_process_view import TelegramAssistantProcessView
from app.workspace.views.vault_item_view_set import VaultItemViewSet
from app.workspace.views.workspace_calendar_view import WorkspaceCalendarView
from app.workspace.views.workspace_cron_dispatch_due_view import WorkspaceCronDispatchDueView
from app.workspace.views.workspace_cron_tick_view import WorkspaceCronTickView
from app.workspace.views.workspace_dashboard_summary_view import WorkspaceDashboardSummaryView
from app.workspace.views.workspace_setting_view import (
    WorkspaceSettingObjectView,
    WorkspaceSettingView,
)

app_name = "workspace"

router = SimpleRouter(trailing_slash=False)
router.register("assets", AssetViewSet, basename="assets")
router.register("warranty-claims", AssetWarrantyClaimViewSet, basename="warranty-claims")
router.register("subscriptions", SubscriptionViewSet, basename="subscriptions")
router.register("subscription-payments", SubscriptionPaymentViewSet, basename="subscription-payments")
router.register("vault-items", VaultItemViewSet, basename="vault-items")
router.register("monitor-targets", MonitorTargetViewSet, basename="monitor-targets")
router.register("monitor-incidents", MonitorIncidentViewSet, basename="monitor-incidents")
router.register("reminders", ReminderViewSet, basename="reminders")
router.register(
    "assistant/conversations",
    AssistantConversationViewSet,
    basename="assistant-conversations",
)

urlpatterns: list[URLPattern | URLResolver] = [
    path("settings", WorkspaceSettingView.as_view(), name="workspace-settings"),
    path(
        "settings/<uuid:owner_id>",
        WorkspaceSettingObjectView.as_view(),
        name="workspace-settings-object",
    ),
    path(
        "dashboard/summary",
        WorkspaceDashboardSummaryView.as_view(),
        name="workspace-dashboard-summary",
    ),
    path("calendar", WorkspaceCalendarView.as_view(), name="workspace-calendar"),
    path("assistant/chat", AssistantChatView.as_view(), name="assistant-chat"),
    path(
        "assistant/telegram-process",
        TelegramAssistantProcessView.as_view(),
        name="telegram-assistant-process",
    ),
    path(
        "assistant/conversations/<uuid:pk>/messages",
        AssistantConversationMessagesView.as_view(),
        name="assistant-conversation-messages",
    ),
    path("cron/tick", WorkspaceCronTickView.as_view(), name="workspace-cron-tick"),
    path(
        "cron/dispatch-due",
        WorkspaceCronDispatchDueView.as_view(),
        name="workspace-cron-dispatch-due",
    ),
    *router.urls,
]
