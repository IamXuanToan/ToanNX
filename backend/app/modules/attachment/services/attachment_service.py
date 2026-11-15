"""Nghiệp vụ file đính kèm: upload, đọc, xóa mềm.

Storage dùng `default_storage` của Django (STORAGES["default"]): local filesystem khi dev,
object storage (S3/R2/Vercel Blob...) khi production — Vercel không có filesystem bền.
"""

import hashlib
from typing import Any

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction

from app.core.exceptions.authorization_error import AuthorizationError
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
    def replace_content(self, actor: Any, attachment_id: Any, content: bytes, name: str) -> Attachment:
        """Thay nội dung file nhưng **giữ id**: nơi đang tham chiếu id tự thấy nội dung mới.

        File vật lý cũ giữ lại theo chính sách dọn storage (giống xóa mềm).

        Args:
            actor: Người thực hiện.
            attachment_id: Id attachment do hệ thống sinh.
            content: Nội dung mới.
            name: Tên hiển thị mới.

        Returns:
            Attachment sau khi thay.
        """
        attachment = self.repository.get_for_update(attachment_id)
        upload = ContentFile(content, name=name)
        if detect_content_type(upload) != attachment.content_type:
            raise ValidationError(details={"file": ["Nội dung mới phải cùng định dạng với file cũ."]})
        return self.repository.update(
            attachment,
            actor=actor,
            file=upload,
            original_name=name[:255],
            size=len(content),
            checksum=hashlib.sha256(content).hexdigest(),
        )

    @transaction.atomic
    def delete_generated(self, actor: Any, attachment_id: Any) -> None:
        """Xóa mềm file do hệ thống sinh khi tài nguyên sở hữu nó bị xóa.

        Args:
            actor: Người thực hiện.
            attachment_id: Id attachment.
        """
        attachment = self.repository.find_by_id(attachment_id)
        if attachment is not None:
            self.repository.delete(attachment, actor=actor)

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
        attachment = self.get_for_write(actor, pk)
        return self.repository.update(attachment, actor=actor, folder=folder)
