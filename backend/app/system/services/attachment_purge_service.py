"""Dọn file vật lý trong storage: file của tệp đã xóa mềm quá hạn giữ và file mồ côi.

- Tệp đã xóa mềm quá `ATTACHMENT_PURGE_DAYS` ngày: xóa file khỏi storage, **giữ dòng dữ liệu** và đánh dấu
  `purged_at` (khóa ngoại như `QrCode.image` là PROTECT, journal vẫn trỏ được tới bản ghi).
- File mồ côi trong `attachments/`: không bản ghi chưa dọn nào trỏ tới (ví dụ ảnh QR cũ sau `replace_content`)
  và cũ hơn hạn giữ. Storage không cho biết thời điểm sửa file thì bỏ qua file đó (an toàn hơn xóa nhầm).
"""

from datetime import timedelta
from typing import Any

from django.conf import settings
from django.core.files.storage import Storage, default_storage
from django.utils import timezone

from app.system.repositories.attachment_repository import AttachmentRepository

ROOT_DIR = "attachments"
BATCH_SIZE = 500


class AttachmentPurgeService:
    """Dọn storage theo hạn giữ."""

    def __init__(
        self, repository: AttachmentRepository | None = None, storage: Storage | None = None
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository file đính kèm.
            storage: Storage (mặc định `default_storage`).
        """
        self.repository = repository or AttachmentRepository()
        self.storage = storage or default_storage

    def purge(self) -> int:
        """Chạy cả hai bước dọn.

        Returns:
            Số file đã xóa khỏi storage.
        """
        before = timezone.now() - timedelta(days=settings.ATTACHMENT_PURGE_DAYS)
        return self.purge_deleted(before) + self.purge_orphans(before)

    def purge_deleted(self, before: Any) -> int:
        """Xóa file của tệp đã xóa mềm trước mốc, theo lô.

        Args:
            before: Mốc thời gian.

        Returns:
            Số file đã xóa.
        """
        rows = self.repository.purgeable_files(before, BATCH_SIZE)
        for _, name in rows:
            self._delete(name)
        self.repository.mark_purged([pk for pk, _ in rows], timezone.now())
        return len(rows)

    def purge_orphans(self, before: Any) -> int:
        """Xóa file trong `attachments/` không còn bản ghi nào trỏ tới và cũ hơn mốc.

        Args:
            before: Mốc thời gian.

        Returns:
            Số file đã xóa.
        """
        referenced = self.repository.referenced_file_names()
        removed = 0
        for name in self._walk(ROOT_DIR):
            if name in referenced or not self._older_than(name, before):
                continue
            self._delete(name)
            removed += 1
        return removed

    def _walk(self, directory: str) -> list[str]:
        """Mọi file dưới thư mục (đường dẫn tương đối trong storage)."""
        try:
            folders, files = self.storage.listdir(directory)
        except (FileNotFoundError, NotImplementedError):
            return []
        names = [f"{directory}/{name}" for name in files]
        for folder in folders:
            names += self._walk(f"{directory}/{folder}")
        return names

    def _older_than(self, name: str, before: Any) -> bool:
        """File sửa lần cuối trước mốc; storage không hỗ trợ thì coi như chưa đủ cũ."""
        try:
            return bool(self.storage.get_modified_time(name) < before)
        except (NotImplementedError, OSError):
            return False

    def _delete(self, name: str) -> None:
        """Xóa file, bỏ qua khi đã không còn."""
        if name:
            self.storage.delete(name)
