"""Task dọn dữ liệu phần Journal (module System) (chạy bởi `manage.py run_cleanup`)."""

from app.system.services.journal_entry_service import JournalEntryService


def purge_journal() -> int:
    """Xóa nhật ký quá hạn lưu.

    Returns:
        Số mục đã xóa.
    """
    return JournalEntryService().purge_expired()
