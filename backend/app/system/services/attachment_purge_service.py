"""Dọn file vật lý trong storage: file của tệp đã xóa mềm quá hạn giữ và file mồ côi.

- Tệp đã xóa mềm quá `ATTACHMENT_PURGE_DAYS` ngày: xóa file khỏi kho của nó, **giữ dòng dữ liệu** và đánh dấu
  `purged_at` (khóa ngoại như `QrCode.image` là PROTECT, journal vẫn trỏ được tới bản ghi).
- File mồ côi trong `attachments/` của từng kho (công khai, riêng tư): không bản ghi chưa dọn nào của kho đó
  trỏ tới (ảnh QR cũ sau `replace_content`, bản cũ sau khi chuyển công khai/riêng tư) và cũ hơn hạn giữ.
  Storage không cho biết thời điểm sửa file thì bỏ qua file đó (an toàn hơn xóa nhầm).
"""

from datetime import timedelta
from typing import Any

from django.conf import settings
from django.core.files.storage import Storage
from django.utils import timezone

from app.system.models.attachment import Attachment
from app.system.repositories.attachment_repository import AttachmentRepository
from app.system.services.attachment_storage_service import AttachmentStorageService

ROOT_DIR = "attachments"
BATCH_SIZE = 500


class AttachmentPurgeService:
    """Dọn storage theo hạn giữ."""

    def __init__(
        self,
        repository: AttachmentRepository | None = None,
        storage_service: AttachmentStorageService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository file đính kèm.
            storage_service: Chọn kho theo chế độ xem.
        """
        self.repository = repository or AttachmentRepository()
        self.storage_service = storage_service or AttachmentStorageService()

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
        for _, name, visibility in rows:
            self.storage_service.delete(visibility, name)
        self.repository.mark_purged([pk for pk, _, _ in rows], timezone.now())
        return len(rows)

    def purge_orphans(self, before: Any) -> int:
        """Xóa file trong `attachments/` của từng kho không còn bản ghi nào trỏ tới và cũ hơn mốc.

        Args:
            before: Mốc thời gian.

        Returns:
            Số file đã xóa.
        """
        removed = 0
        for visibility in Attachment.Visibility.values:
            storage = self.storage_service.storage_for(visibility)
            referenced = self.repository.referenced_file_names(visibility)
            for name in self._walk(storage, ROOT_DIR):
                if name in referenced or not self._older_than(storage, name, before):
                    continue
                self.storage_service.delete(visibility, name)
                removed += 1
        return removed

    def _walk(self, storage: Storage, directory: str) -> list[str]:
        """Mọi file dưới thư mục (đường dẫn tương đối trong storage)."""
        try:
            folders, files = storage.listdir(directory)
        except (FileNotFoundError, NotImplementedError):
            return []
        names = [f"{directory}/{name}" for name in files]
        for folder in folders:
            names += self._walk(storage, f"{directory}/{folder}")
        return names

    def _older_than(self, storage: Storage, name: str, before: Any) -> bool:
        """File sửa lần cuối trước mốc; storage không hỗ trợ thì coi như chưa đủ cũ."""
        try:
            return bool(storage.get_modified_time(name) < before)
        except (NotImplementedError, OSError):
            return False
