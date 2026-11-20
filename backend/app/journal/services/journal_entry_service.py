"""Đọc nhật ký thay đổi toàn hệ thống."""

from datetime import timedelta
from typing import Any

from django.apps import apps
from django.conf import settings
from django.utils import timezone

from app.core.services.core_crud_service import CoreCrudService
from app.core.tracking.journal_tracker import JournalTracker
from app.journal.models.journal_entry import JournalEntry
from app.journal.repositories.journal_entry_repository import JournalEntryRepository


class JournalEntryService(CoreCrudService[JournalEntry, JournalEntryRepository]):
    """Nhật ký chỉ đọc qua API; ghi do `JournalRecorder`."""

    repository_class = JournalEntryRepository

    @staticmethod
    def list_resources() -> list[dict[str, Any]]:
        """Tài nguyên đang ghi lịch sử (model kế thừa JournalTracker), làm bộ lọc `module.model`.

        Returns:
            `[{resource, module, model, name, field_labels}]` sắp theo `resource`.
        """
        items = [
            {
                "resource": model.journal_resource(),
                "module": model._meta.app_label,
                "model": model._meta.model_name,
                "name": str(model._meta.verbose_name),
                "field_labels": {
                    field.name: str(field.verbose_name) for field in model.journal_tracked_fields()
                },
            }
            for model in apps.get_models()
            if issubclass(model, JournalTracker)
        ]
        return sorted(items, key=lambda item: item["resource"])

    def purge_expired(self) -> int:
        """Xóa mục cũ hơn `JOURNAL_RETENTION_DAYS`.

        Returns:
            Số mục đã xóa.
        """
        moment = timezone.now() - timedelta(days=settings.JOURNAL_RETENTION_DAYS)
        return self.repository.delete_before(moment)
