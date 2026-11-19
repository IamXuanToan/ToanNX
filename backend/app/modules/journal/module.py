"""Đăng ký module Journal."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.journal.permissions.journal_entry_permission import JournalEntryPermission

MODULE = ModuleDescriptor(
    code="journal",
    name="Journal",
    description="Lịch sử thay đổi của các model kế thừa JournalTracker.",
    version="1.0.0",
    dependencies=("account", "iam"),
    permissions=JournalEntryPermission.all(),
    cleanup_tasks=("app.modules.journal.tasks.purge_journal.purge_journal",),
)
