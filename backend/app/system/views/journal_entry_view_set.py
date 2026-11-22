"""API nhật ký toàn hệ thống (chỉ đọc).

GET /system/journal-entries?resource=system.user,system.role&module=&action=&actor=&object_id=
                    &created_from=&created_to=
GET /journal/entries/{id}
"""

from app.core.serializers.core_journal_entry_response_serializer import CoreJournalEntryResponseSerializer
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.journal_entry_filter import JournalEntryFilter
from app.system.models.journal_entry import JournalEntry
from app.system.permissions.journal_entry_permission import JournalEntryPermission
from app.system.services.journal_entry_service import JournalEntryService
from app.system.types.permission_rule import DENY, permission_rule


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
    bulk_delete_enabled = True
    http_method_names = ["get", "post", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(JournalEntryPermission.ENTRY_READ),
        "retrieve": permission_rule(JournalEntryPermission.ENTRY_READ),
        "create": DENY,  # nhật ký chỉ do JournalRecorder ghi; POST chỉ mở cho bulk-delete
        "destroy": permission_rule(JournalEntryPermission.ENTRY_DELETE),
        "bulk_delete": permission_rule(JournalEntryPermission.ENTRY_DELETE),
    }
