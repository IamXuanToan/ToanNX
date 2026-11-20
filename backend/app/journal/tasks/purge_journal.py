"""Task dọn dữ liệu của module Journal (chạy bởi `manage.py run_cleanup`)."""

from app.journal.services.journal_entry_service import JournalEntryService


def purge_journal() -> int:
    """Xóa nhật ký quá hạn lưu.

    Returns:
        Số mục đã xóa.
    """
    return JournalEntryService().purge_expired()
