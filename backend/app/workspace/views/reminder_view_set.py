"""CRUD Nhắc việc cá nhân (`/api/v1/workspace/reminders`)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.reminder_filter import ReminderFilter
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission as P
from app.workspace.serializers.responses.reminder_response_serializer import (
    ReminderResponseSerializer,
)
from app.workspace.serializers.validates.reminder_bulk_update_validate_serializer import (
    ReminderBulkUpdateValidateSerializer,
)
from app.workspace.serializers.validates.reminder_create_validate_serializer import (
    ReminderCreateValidateSerializer,
)
from app.workspace.serializers.validates.reminder_update_validate_serializer import (
    ReminderUpdateValidateSerializer,
)
from app.workspace.services.reminder_service import ReminderService


class ReminderViewSet(CoreModelViewSet[Reminder]):
    """Quản lý công việc/nhắc hẹn cá nhân và hoàn thành hàng loạt."""

    service_class = ReminderService
    filterset_class = ReminderFilter
    search_fields = ("title", "description")
    ordering_fields = ("due_date", "priority", "created_at")
    ordering = ("due_date", "-created_at", "-pk")
    list_serializer_class = ReminderResponseSerializer
    detail_serializer_class = ReminderResponseSerializer
    create_serializer_class = ReminderCreateValidateSerializer
    update_serializer_class = ReminderUpdateValidateSerializer
    bulk_update_serializer_class = ReminderBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": WorkspaceRateLimitKey.REMINDER_CREATE}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
