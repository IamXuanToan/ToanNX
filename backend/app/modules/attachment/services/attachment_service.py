"""Nghiệp vụ file đính kèm: upload, đọc, xóa mềm.

Storage dùng `default_storage` của Django (STORAGES["default"]): local filesystem khi dev,
object storage (S3/R2/Vercel Blob...) khi production — Vercel không có filesystem bền.
"""

import hashlib
from typing import Any

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.db.models import QuerySet

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.repositories.attachment_repository import AttachmentRepository
from app.modules.attachment.services.attachment_folder_service import AttachmentFolderService
from app.modules.attachment.utils.file_signature import detect_content_type
from app.modules.attachment.utils.svg_inspector import SVG_CONTENT_TYPE, find_svg_problem

_CHUNK_SIZE = 64 * 1024


class AttachmentService(CoreCrudService[Attachment, AttachmentRepository]):
    """Nghiệp vụ Attachment (xóa = xóa mềm, file vật lý giữ lại để dọn theo lịch)."""

    repository_class = AttachmentRepository

    def __init__(
        self,
        repository: AttachmentRepository | None = None,
        folder_service: AttachmentFolderService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc của kho file và thư mục logic."""
        super().__init__(repository)
        self.folder_service = folder_service or AttachmentFolderService()

    # Attachment là module nền của Account/IAM: dùng backend quyền chuẩn của User,
    # giữ CoreCrudService và cung cấp hợp đồng owned, tránh phụ thuộc vòng vào IAM.
    def get_queryset_for(self, actor: Any) -> QuerySet[Attachment]:
        """Chỉ lấy file tự upload, trừ người có quyền quản lý mọi file."""
        if actor.has_perm(AttachmentPermission.FILE_MANAGE_ALL.code):
            return self.repository.get_queryset()
        return self.repository.filter(created_by_id=actor.pk)

    def _can_access(self, actor: Any, attachment: Attachment) -> bool:
        """Kiểm tra người upload hoặc quyền mở rộng phạm vi."""
        return bool(
            actor.pk == attachment.created_by_id or actor.has_perm(AttachmentPermission.FILE_MANAGE_ALL.code)
        )

    def get_by_id_for(self, actor: Any, pk: Any) -> Attachment:
        """Trả 404 khi file thuộc người khác, không tiết lộ file tồn tại."""
        attachment = self.repository.get_by_id(pk)
        if not self._can_access(actor, attachment):
            raise NotFoundError()
        return attachment

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Khóa file, kiểm tra chủ sở hữu rồi xóa mềm; giữ file vật lý."""
        attachment = self.repository.get_for_update(pk)
        if attachment.deleted_at is not None or not self._can_access(actor, attachment):
            raise NotFoundError()
        self.repository.soft_delete(attachment, actor=actor)

    @transaction.atomic
    def bulk_delete(self, actor: Any, ids: list[Any]) -> int:
        """Xóa mềm cả lô trong một transaction; lỗi một file thì không file nào đổi."""
        for pk in ids:
            self.delete(actor, pk)
        return len(ids)

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
            content_type=content_type,
            size=upload.size or 0,
            checksum=digest.hexdigest(),
            folder=folder,
        )

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Attachment:
        """Chỉ đổi nhóm logic; khóa nhóm trước file để tránh deadlock với xóa nhóm."""
        current = self.get_by_id_for(actor, pk)
        if "folder_id" not in data:
            return current
        folder_id = data["folder_id"]
        folder = (
            self.folder_service.get_for_file(actor, folder_id, current.created_by_id) if folder_id else None
        )
        attachment = self.repository.get_for_update(pk)
        if attachment.deleted_at is not None or not self._can_access(actor, attachment):
            raise NotFoundError()
        return self.repository.update(attachment, actor=actor, folder=folder)

    @transaction.atomic
    def bulk_update(self, actor: Any, ids: list[Any], data: dict[str, Any]) -> int:
        """Chuyển cả lô hoặc rollback toàn bộ khi có file/thư mục ngoài phạm vi."""
        for pk in sorted(ids, key=str):
            self.update(actor, pk, data)
        return len(ids)
