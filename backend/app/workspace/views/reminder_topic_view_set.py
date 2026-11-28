"""CRUD Chủ đề nhắc việc (`/api/v1/workspace/reminder-topics`)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.reminder_topic_filter import ReminderTopicFilter
from app.workspace.models.reminder_topic import ReminderTopic
from app.workspace.permissions.reminder_topic_permission import ReminderTopicPermission as P
from app.workspace.serializers.responses.reminder_topic_response_serializer import (
    ReminderTopicResponseSerializer,
)
from app.workspace.serializers.validates.reminder_topic_create_validate_serializer import (
    ReminderTopicCreateValidateSerializer,
)
from app.workspace.serializers.validates.reminder_topic_update_validate_serializer import (
    ReminderTopicUpdateValidateSerializer,
)
from app.workspace.services.reminder_topic_service import ReminderTopicService


class ReminderTopicViewSet(CoreModelViewSet[ReminderTopic]):
    """Quản lý chủ đề nhắc việc (đọc chung mặc định hệ thống + CRUD riêng của từng user)."""

    service_class = ReminderTopicService
    filterset_class = ReminderTopicFilter
    search_fields = ("name", "code")
    ordering_fields = ("sort_order", "name", "created_at")
    ordering = ("sort_order", "name", "-pk")
    list_serializer_class = ReminderTopicResponseSerializer
    detail_serializer_class = ReminderTopicResponseSerializer
    create_serializer_class = ReminderTopicCreateValidateSerializer
    update_serializer_class = ReminderTopicUpdateValidateSerializer
    bulk_delete_enabled = True
    action_rate_limits = {"create": WorkspaceRateLimitKey.REMINDER_CREATE}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
