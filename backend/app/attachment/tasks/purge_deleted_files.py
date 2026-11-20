"""Task dọn file vật lý của module Attachment (chạy bởi `manage.py run_cleanup`)."""

from app.attachment.services.attachment_purge_service import AttachmentPurgeService


def purge_deleted_files() -> int:
    """Dọn file của tệp đã xóa mềm quá `ATTACHMENT_PURGE_DAYS` ngày và file mồ côi trong storage.

    Returns:
        Số file đã xóa khỏi storage.
    """
    return AttachmentPurgeService().purge()
