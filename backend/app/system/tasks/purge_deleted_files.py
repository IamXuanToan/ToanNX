"""Task dọn file vật lý phần Thư viện (module System) (chạy bởi `manage.py run_cleanup`)."""

from app.system.services.attachment_purge_service import AttachmentPurgeService


def purge_deleted_files() -> int:
    """Dọn file của tệp đã xóa mềm quá `ATTACHMENT_PURGE_DAYS` ngày và file mồ côi trong storage.

    Returns:
        Số file đã xóa khỏi storage.
    """
    return AttachmentPurgeService().purge()
