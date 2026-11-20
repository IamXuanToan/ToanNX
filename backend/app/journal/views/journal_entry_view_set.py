"""API nhật ký toàn hệ thống (chỉ đọc).

GET /journal/entries?resource=account.user,iam.role&module=&action=&actor=&object_id=
                    &created_from=&created_to=
GET /journal/entries/{id}
"""

from app.core.serializers.core_journal_entry_response_serializer import CoreJournalEntryResponseSerializer
from app.core.views.core_model_view_set import CoreModelViewSet
from app.iam.types.permission_rule import permission_rule
from app.journal.filters.journal_entry_filter import JournalEntryFilter
from app.journal.models.journal_entry import JournalEntry
from app.journal.permissions.journal_entry_permission import JournalEntryPermission
from app.journal.services.journal_entry_service import JournalEntryService


class JournalEntryViewSet(CoreModelViewSet[JournalEntry]):
    """Danh sách và chi tiết mục nhật ký.

    Lịch sử của một bản ghi đọc qua `…/{id}/history` của chính tài nguyên đó.
    """

    service_class = JournalEntryService
    filterset_class = JournalEntryFilter
    search_fields = ("object_label", "actor_label", "object_id")
    ordering_fields = ("created_at",)
    ordering = ("-created_at", "-pk")
    list_serializer_class = CoreJournalEntryResponseSerializer
    detail_serializer_class = CoreJournalEntryResponseSerializer
    http_method_names = ["get", "head", "options"]
    action_permissions = {
        "list": permission_rule(JournalEntryPermission.ENTRY_READ),
        "retrieve": permission_rule(JournalEntryPermission.ENTRY_READ),
    }
