"""Chọn kho lưu theo chế độ xem của file và thao tác file vật lý (lưu, mở, xóa, chuyển kho, link ký).

- `public`  → `STORAGES["default"]`: URL trực tiếp (R2 custom domain hoặc `/media/` khi dev).
- `private` → `STORAGES["private"]`: bucket R2 không bật public access (link ký hạn ngắn) hoặc thư mục
  `PRIVATE_MEDIA_ROOT` khi dev (không được phục vụ công khai, API stream nội dung).
"""

import logging
from typing import IO
from urllib.parse import quote

from django.conf import settings
from django.core.files.base import File
from django.core.files.storage import Storage, storages

from app.core.exceptions.validation_error import ValidationError
from app.system.constants.attachment_error_code import AttachmentErrorCode
from app.system.models.attachment import Attachment, attachment_upload_path

logger = logging.getLogger(__name__)

# Loại file luôn tải về thay vì hiển thị trong trình duyệt.
DOWNLOAD_ONLY_CONTENT_TYPES = frozenset(
    {
        "text/csv",
        "application/xml",
        "image/svg+xml",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
)


class AttachmentStorageService:
    """Thao tác file vật lý của Attachment theo `visibility`."""

    def storage_for(self, visibility: str) -> Storage:
        """Kho lưu ứng với chế độ xem.

        Args:
            visibility: `public` hoặc `private`.

        Returns:
            Storage của Django.
        """
        return storages["private" if visibility == Attachment.Visibility.PRIVATE else "default"]

    def ensure_ready(self, visibility: str) -> None:
        """Từ chối lưu file riêng tư khi chưa cấu hình kho riêng tư (dùng R2 mà thiếu bucket riêng tư).

        Raises:
            ValidationError: Kho riêng tư chưa cấu hình.
        """
        if visibility == Attachment.Visibility.PRIVATE and not settings.PRIVATE_STORAGE_ENABLED:
            raise ValidationError(
                "Chưa cấu hình kho lưu file riêng tư.",
                code=AttachmentErrorCode.ATTACHMENT_PRIVATE_STORAGE_NOT_CONFIGURED,
            )

    def save_upload(self, visibility: str, upload: File) -> str:
        """Lưu file upload vào kho theo chế độ xem.

        Args:
            visibility: Chế độ xem.
            upload: File (con trỏ ở đầu).

        Returns:
            Đường dẫn thực tế trong kho (`attachments/YYYY/MM/<uuid><ext>`).
        """
        self.ensure_ready(visibility)
        name = attachment_upload_path(None, upload.name or "file")
        return self.storage_for(visibility).save(name, upload)

    def open(self, attachment: Attachment) -> IO[bytes]:
        """Mở file để đọc nhị phân (nơi gọi tự đóng)."""
        return self.storage_for(attachment.visibility).open(str(attachment.file.name), "rb")

    def public_url(self, attachment: Attachment) -> str:
        """URL trực tiếp của file công khai (tương đối khi dev)."""
        return str(self.storage_for(Attachment.Visibility.PUBLIC).url(attachment.file.name))

    def signed_url(self, attachment: Attachment) -> str | None:
        """Link ký hạn ngắn tới file riêng tư; None khi kho không hỗ trợ (filesystem → stream qua API).

        Args:
            attachment: File riêng tư.

        Returns:
            URL ký hoặc None.
        """
        storage = self.storage_for(Attachment.Visibility.PRIVATE)
        if not getattr(storage, "querystring_auth", False):
            return None
        disposition = "attachment" if self.is_download_only(attachment) else "inline"
        filename = quote(attachment.original_name or "file", safe="")
        parameters = {
            "ResponseContentType": attachment.content_type,
            "ResponseContentDisposition": f"{disposition}; filename*=UTF-8''{filename}",
            "ResponseCacheControl": "private, no-store",
        }
        # S3Storage.url nhận `parameters` (chuyển vào presigned URL); Storage gốc của Django thì không.
        return str(storage.url(attachment.file.name, parameters=parameters))  # type: ignore[call-arg]

    def is_download_only(self, attachment: Attachment) -> bool:
        """Loại file chỉ cho tải về (CSV/XLSX/XML) để trình duyệt không hiển thị trực tiếp."""
        return attachment.content_type in DOWNLOAD_ONLY_CONTENT_TYPES

    def copy_to(self, attachment: Attachment, target_visibility: str) -> str:
        """Chép file sang kho của chế độ đích (chưa xóa bản cũ).

        Args:
            attachment: File nguồn (đọc theo `visibility` hiện tại).
            target_visibility: Chế độ đích.

        Returns:
            Đường dẫn trong kho đích.
        """
        self.ensure_ready(target_visibility)
        target = self.storage_for(target_visibility)
        with self.open(attachment) as source:
            return target.save(attachment.file.name, File(source, name=attachment.file.name))

    def delete(self, visibility: str, name: str | None) -> None:
        """Xóa file vật lý; lỗi kho chỉ ghi log để không làm hỏng luồng chính (file mồ côi được dọn sau)."""
        if not name:
            return
        try:
            self.storage_for(visibility).delete(name)
        except (OSError, FileNotFoundError):
            pass
        except Exception:  # noqa: BLE001 - driver cloud ném nhiều loại lỗi; dọn file mồ côi xử lý sau
            logger.warning("Không thể xóa file %s khỏi kho %s", name, visibility, exc_info=True)
