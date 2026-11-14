"""Nghiệp vụ file đính kèm: upload, đọc, xóa mềm.

Storage dùng `default_storage` của Django (STORAGES["default"]): local filesystem khi dev,
object storage (S3/R2/Vercel Blob...) khi production — Vercel không có filesystem bền.
"""

import hashlib
from typing import Any

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.repositories.attachment_repository import AttachmentRepository
from app.modules.attachment.utils.file_signature import detect_content_type
from app.modules.attachment.utils.svg_inspector import SVG_CONTENT_TYPE, find_svg_problem

_CHUNK_SIZE = 64 * 1024


class AttachmentService(CoreCrudService[Attachment, AttachmentRepository]):
    """Nghiệp vụ Attachment (xóa = xóa mềm, file vật lý giữ lại để dọn theo lịch)."""

    repository_class = AttachmentRepository

    def get_image(self, attachment_id: Any) -> Attachment:
        """Lấy file và bảo đảm là ảnh (dùng cho ảnh đại diện).

        Args:
            attachment_id: Id file.

        Returns:
            Attachment là ảnh.

        Raises:
            NotFoundError: Không tồn tại.
            ValidationError: File không phải ảnh.
        """
        attachment = self.get_by_id(attachment_id)
        if not attachment.is_image:
            raise ValidationError(details={"avatar_id": ["File phải là ảnh."]})
        return attachment

    def get_svg(self, attachment_id: Any, field: str = "icon_id") -> Attachment:
        """Lấy file và bảo đảm là SVG (dùng cho icon).

        Args:
            attachment_id: Id file.
            field: Tên field báo lỗi.

        Returns:
            Attachment SVG.

        Raises:
            NotFoundError: Không tồn tại.
            ValidationError: File không phải SVG.
        """
        attachment = self.get_by_id(attachment_id)
        if attachment.content_type != SVG_CONTENT_TYPE:
            raise ValidationError(details={field: ["File phải là SVG."]})
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
        )

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Attachment:
        """Không hỗ trợ sửa file; upload file mới thay thế.

        Args:
            actor: Người thực hiện.
            pk: Id file.
            data: Dữ liệu.

        Raises:
            BusinessRuleError: Luôn luôn.
        """
        raise BusinessRuleError("File không sửa được; hãy upload file mới.")
