"""Nghiệp vụ file đính kèm: upload, đọc, xóa mềm.

Storage dùng `default_storage` của Django (STORAGES["default"]): local filesystem khi dev,
object storage (S3/R2/Vercel Blob...) khi production — Vercel không có filesystem bền.
"""

import hashlib
import logging
from typing import Any

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.utils import timezone

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.repositories.attachment_repository import AttachmentRepository
from app.system.services.attachment_folder_service import AttachmentFolderService
from app.system.utils.file_signature import detect_content_type
from app.system.utils.svg_inspector import SVG_CONTENT_TYPE, find_svg_problem

_CHUNK_SIZE = 64 * 1024
logger = logging.getLogger(__name__)


class AttachmentService(CoreCrudService[Attachment, AttachmentRepository]):
    """Nghiệp vụ Attachment (xóa = xóa mềm, file vật lý giữ lại để dọn theo lịch)."""

    repository_class = AttachmentRepository
    # Owner là người upload; quyền manage_all mở phạm vi sang file của mọi người.
    owner_field = "created_by"
    manage_all_permission = AttachmentPermission.FILE_MANAGE_ALL.code

    def __init__(
        self,
        repository: AttachmentRepository | None = None,
        folder_service: AttachmentFolderService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc của kho file và thư mục logic."""
        super().__init__(repository)
        self.folder_service = folder_service or AttachmentFolderService()

    def get_image(self, attachment_id: Any, *, actor: Any | None = None) -> Attachment:
        """Lấy file và bảo đảm là ảnh (dùng cho ảnh đại diện).

        Args:
            attachment_id: Id file.
            actor: Người chọn ảnh; truyền vào khi gán ảnh từ dữ liệu client.

        Returns:
            Attachment là ảnh.

        Raises:
            NotFoundError: Không tồn tại.
            ValidationError: File không phải ảnh.
        """
        if actor is not None and not actor.has_perm(AttachmentPermission.FILE_READ.code):
            raise AuthorizationError(details={"permissions": [AttachmentPermission.FILE_READ.code]})
        attachment = (
            self.get_by_id_for(actor, attachment_id) if actor is not None else self.get_by_id(attachment_id)
        )
        if not attachment.is_image:
            raise ValidationError(details={"avatar_id": ["File phải là ảnh."]})
        return attachment

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Attachment:
        """Kiểm tra và lưu file upload.

        Args:
            actor: Người upload.
            data: Dữ liệu đã qua AttachmentUploadValidateSerializer (`file`).

        Returns:
            Attachment đã lưu.

        Raises:
            ValidationError: Định dạng không được phép.
        """
        upload: UploadedFile = data["file"]
        folder_id = data.get("folder_id")
        folder = self.folder_service.get_for_file(actor, folder_id, actor.pk) if folder_id else None

        # ============================================================
        # BƯỚC 1: Xác định kiểu file từ chữ ký, không tin header client; SVG phải an toàn
        # ============================================================
        content_type = detect_content_type(upload)
        if content_type not in settings.ATTACHMENT_ALLOWED_CONTENT_TYPES:
            raise ValidationError(
                "Định dạng file không được hỗ trợ.",
                details={"file": ["Định dạng file không được hỗ trợ."]},
            )

        if content_type == SVG_CONTENT_TYPE:
            problem = find_svg_problem(upload)
            if problem:
                raise ValidationError(problem, details={"file": [problem]})

        # ============================================================
        # BƯỚC 2: Tính checksum rồi lưu vào storage + DB
        # ============================================================
        digest = hashlib.sha256()
        for chunk in upload.chunks(_CHUNK_SIZE):
            digest.update(chunk)
        upload.seek(0)
        return self.repository.create(
            actor=actor,
            file=upload,
            original_name=(upload.name or "file")[:255],
            alt_text=(data.get("alt_text") or "").strip()[:255],
            content_type=content_type,
            size=upload.size or 0,
            checksum=digest.hexdigest(),
            folder=folder,
        )

    def find_alive_images(self, ids: Any) -> dict[str, Attachment]:
        """Ảnh còn tồn tại theo id (một query), dùng khi dựng nội dung công khai.

        Args:
            ids: Id attachment.

        Returns:
            `{id dạng chuỗi: attachment}`; id không tồn tại/không phải ảnh thì không có trong kết quả.
        """
        return {str(item.pk): item for item in self.repository.filter(pk__in=list(ids)) if item.is_image}

    # ==================================================================
    # File do hệ thống sinh (ảnh mã QR...): module khác gọi, không qua upload của client
    # ==================================================================
    @transaction.atomic
    def create_generated(self, actor: Any, content: bytes, name: str) -> Attachment:
        """Lưu file do hệ thống sinh vào Thư viện của actor (vẫn kiểm chữ ký file).

        Args:
            actor: Chủ file (người tạo tài nguyên sinh ra file).
            content: Nội dung file.
            name: Tên hiển thị (ví dụ `ung-ho.png`).

        Returns:
            Attachment đã lưu.
        """
        return self.create(actor, {"file": ContentFile(content, name=name)})

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm file trong DB và xóa file vật lý trên storage (R2/local).

        Args:
            actor: Người thực hiện.
            pk: Id file.
        """
        instance = self.get_for_write(actor, pk)
        file_name = instance.file.name if instance.file else None
        storage = instance.file.storage if instance.file else None

        self.repository.delete(instance, actor=actor)
        self.repository.mark_purged([instance.pk], timezone.now())

        if file_name and storage:
            self._delete_from_storage(storage, file_name)

    @transaction.atomic
    def replace_content(self, actor: Any, attachment_id: Any, content: bytes, name: str) -> Attachment:
        """Thay nội dung file nhưng **giữ id**: nơi đang tham chiếu id tự thấy nội dung mới.

        File vật lý cũ được xóa khỏi storage (R2/local) ngay lập tức.

        Args:
            actor: Người thực hiện.
            attachment_id: Id attachment do hệ thống sinh.
            content: Nội dung mới.
            name: Tên hiển thị mới.

        Returns:
            Attachment sau khi thay.
        """
        attachment = self.repository.get_for_update(attachment_id)
        old_file_name = attachment.file.name if attachment.file else None
        old_storage = attachment.file.storage if attachment.file else None
        upload = ContentFile(content, name=name)
        if detect_content_type(upload) != attachment.content_type:
            raise ValidationError(details={"file": ["Nội dung mới phải cùng định dạng với file cũ."]})
        updated = self.repository.update(
            attachment,
            actor=actor,
            file=upload,
            original_name=name[:255],
            size=len(content),
            checksum=hashlib.sha256(content).hexdigest(),
        )
        if old_file_name and old_storage and old_file_name != updated.file.name:
            self._delete_from_storage(old_storage, old_file_name)
        return updated

    @transaction.atomic
    def delete_generated(self, actor: Any, attachment_id: Any) -> None:
        """Xóa mềm file do hệ thống sinh và xóa file vật lý trên storage (R2/local).

        Args:
            actor: Người thực hiện.
            attachment_id: Id attachment.
        """
        attachment = self.repository.find_by_id(attachment_id)
        if attachment is not None:
            file_name = attachment.file.name if attachment.file else None
            storage = attachment.file.storage if attachment.file else None
            self.repository.delete(attachment, actor=actor)
            self.repository.mark_purged([attachment.pk], timezone.now())
            if file_name and storage:
                self._delete_from_storage(storage, file_name)

    @staticmethod
    def _delete_from_storage(storage: Any, name: str) -> None:
        """Xóa file vật lý khỏi storage (R2/local), log cảnh báo nếu gặp lỗi kết nối."""
        if not name:
            return
        try:
            storage.delete(name)
        except (OSError, FileNotFoundError):
            pass
        except Exception:  # noqa: BLE001 - Bắt mọi ngoại lệ của cloud storage driver để không gián đoạn luồng chính
            logger.warning("Không thể xóa file %s khỏi storage", name, exc_info=True)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Attachment:
        """Cập nhật thông tin file: tên hiển thị, alt text hoặc chuyển nhóm logic."""
        current = self.get_by_id_for(actor, pk)
        update_fields: dict[str, Any] = {}

        if "original_name" in data:
            name = (data["original_name"] or "").strip()
            if not name:
                raise ValidationError(
                    "Tên file không được để trống.",
                    details={"original_name": ["Tên file không được để trống."]},
                )
            update_fields["original_name"] = name[:255]

        if "alt_text" in data:
            update_fields["alt_text"] = (data["alt_text"] or "").strip()[:255]

        if "folder_id" in data:
            folder_id = data["folder_id"]
            folder = (
                self.folder_service.get_for_file(actor, folder_id, current.created_by_id)
                if folder_id
                else None
            )
            update_fields["folder"] = folder

        if not update_fields:
            return current

        attachment = self.get_for_write(actor, pk)
        return self.repository.update(attachment, actor=actor, **update_fields)
