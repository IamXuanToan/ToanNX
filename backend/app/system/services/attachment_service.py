"""Nghiệp vụ file đính kèm: upload, đọc, xóa mềm, chuyển công khai/riêng tư.

Kho lưu chọn theo `Attachment.visibility` qua `AttachmentStorageService` (công khai: STORAGES["default"];
riêng tư: STORAGES["private"]) — Vercel không có filesystem bền nên production dùng R2.
"""

import hashlib
from typing import Any

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.utils import timezone

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.core.storage.r2_usage_service import R2UsageService
from app.system.constants.attachment_error_code import AttachmentErrorCode
from app.system.constants.notification_defaults import STORAGE_WARNING_PERCENT
from app.system.constants.system_notification_event import SystemNotificationEvent
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.repositories.attachment_repository import AttachmentRepository
from app.system.services.attachment_folder_service import AttachmentFolderService
from app.system.services.attachment_storage_service import (
    DOWNLOAD_ONLY_CONTENT_TYPES,
    AttachmentStorageService,
)
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload
from app.system.utils.file_signature import detect_content_type
from app.system.utils.svg_inspector import SVG_CONTENT_TYPE, find_svg_problem

_CHUNK_SIZE = 64 * 1024
PERCENT = 100
GIGABYTE_DIVISOR = 1024**3
ATTACHMENTS_PATH = "/admin/attachments"


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
        r2_usage_service: R2UsageService | None = None,
        storage_service: AttachmentStorageService | None = None,
        private_r2_usage_service: R2UsageService | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc: kho file, thư mục logic, đo dung lượng R2, kho lưu theo chế độ xem."""
        super().__init__(repository)
        self.folder_service = folder_service or AttachmentFolderService()
        self.r2_usage_service = r2_usage_service or R2UsageService()
        self.private_r2_usage_service = private_r2_usage_service or R2UsageService(
            bucket_name=settings.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME
        )
        self.storage_service = storage_service or AttachmentStorageService()
        self.notification_service = notification_service or NotificationService()

    def _warn_quota(self, total_bytes: int) -> None:
        """Dung lượng vượt ngưỡng cảnh báo → báo người có `manage_all` file (gom theo ngày)."""
        limit = settings.ATTACHMENT_MAX_TOTAL_STORAGE_BYTES
        if not limit or total_bytes * PERCENT < limit * STORAGE_WARNING_PERCENT:
            return
        used = round(total_bytes * PERCENT / limit)
        self.notification_service.notify(
            SystemNotificationEvent.STORAGE_QUOTA_WARNING,
            dedup_key=f"{timezone.now():%Y%m%d}",
            payload=NotificationPayload(
                title=f"Dung lượng lưu trữ đã dùng {used}%",
                body="Dọn file không dùng hoặc tăng giới hạn ATTACHMENT_MAX_TOTAL_STORAGE_BYTES.",
                link=ATTACHMENTS_PATH,
                message_key="system.notifications.events.storageQuota",
                params={"percent": used},
                details=(
                    (
                        "📊 Đã dùng",
                        f"{used}% ({total_bytes / GIGABYTE_DIVISOR:.2f} GB"
                        f" / {limit / GIGABYTE_DIVISOR:.0f} GB)",
                    ),
                    ("🛠️ Cách xử lý", "Dọn file không dùng hoặc tăng ATTACHMENT_MAX_TOTAL_STORAGE_BYTES."),
                ),
            ),
        )

    def get_current_storage_usage_bytes(self) -> int:
        """Lấy tổng dung lượng lưu trữ hiện tại.

        Ưu tiên:
        1. Gọi trực tiếp Cloudflare R2 Usage API nếu có cấu hình `CLOUDFLARE_API_TOKEN`.
        2. Fallback về tổng dung lượng của các tệp vật lý chưa bị purged (purged_at IS NULL).

        Returns:
            Số bytes nguyên.
        """
        public_usage = self.r2_usage_service.get_bucket_usage_bytes()
        if public_usage is None:
            # Không đo được bucket công khai: tổng DB của cả hai chế độ (công khai + riêng tư).
            return self.repository.get_total_storage_size()
        if self.private_r2_usage_service.bucket_name == self.r2_usage_service.bucket_name:
            # Cấu hình nhầm hai kho cùng một bucket: số của API đã gồm mọi file, cộng nữa là đếm hai lần.
            return public_usage
        # Bucket riêng tư chưa cấu hình/lỗi API thì cộng tổng file riêng tư trong DB.
        private_usage = (
            self.private_r2_usage_service.get_bucket_usage_bytes()
            if self.private_r2_usage_service.is_configured()
            else None
        )
        if private_usage is None:
            private_usage = self.repository.get_total_storage_size(Attachment.Visibility.PRIVATE)
        return public_usage + private_usage

    def get_image(self, attachment_id: Any, *, actor: Any | None = None) -> Attachment:
        """Lấy file và bảo đảm là ảnh công khai (ảnh đại diện, logo QR: người khác phải xem được).

        Args:
            attachment_id: Id file.
            actor: Người chọn ảnh; truyền vào khi gán ảnh từ dữ liệu client.

        Returns:
            Attachment là ảnh công khai.

        Raises:
            NotFoundError: Không tồn tại.
            ValidationError: File không phải ảnh hoặc đang riêng tư.
        """
        if actor is not None and not actor.has_perm(AttachmentPermission.FILE_READ.code):
            raise AuthorizationError(details={"permissions": [AttachmentPermission.FILE_READ.code]})
        attachment = (
            self.get_by_id_for(actor, attachment_id) if actor is not None else self.get_by_id(attachment_id)
        )
        if not attachment.is_image:
            raise ValidationError(details={"avatar_id": ["File phải là ảnh."]})
        if attachment.is_private:
            raise ValidationError(
                "Ảnh đang ở chế độ riêng tư.",
                code=AttachmentErrorCode.ATTACHMENT_MUST_BE_PUBLIC,
                details={"avatar_id": ["Ảnh phải ở chế độ công khai."]},
            )
        return attachment

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Attachment:
        """Kiểm tra và lưu file upload.

        Args:
            actor: Người upload.
            data: Dữ liệu đã qua AttachmentUploadValidateSerializer (`file`, `visibility` tùy chọn:
                không gửi thì CSV/XLSX/XML mặc định riêng tư, loại khác công khai).

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
                "Định dạng file không được hỗ trợ hoặc file bị hỏng.",
                details={"file": ["Định dạng file không được hỗ trợ hoặc file bị hỏng."]},
            )
        visibility = data.get("visibility") or (
            Attachment.Visibility.PRIVATE
            if content_type in DOWNLOAD_ONLY_CONTENT_TYPES
            else Attachment.Visibility.PUBLIC
        )
        self.storage_service.ensure_ready(visibility)

        if content_type == SVG_CONTENT_TYPE:
            problem = find_svg_problem(upload)
            if problem:
                raise ValidationError(problem, details={"file": [problem]})

        # ============================================================
        # BƯỚC 2: Kiểm tra tổng dung lượng lưu trữ hệ thống (Storage Quota)
        # ============================================================
        file_size = upload.size or 0
        current_total = self.get_current_storage_usage_bytes()
        self._warn_quota(current_total + file_size)
        if current_total + file_size > settings.ATTACHMENT_MAX_TOTAL_STORAGE_BYTES:
            max_gb = round(settings.ATTACHMENT_MAX_TOTAL_STORAGE_BYTES / (1024 * 1024 * 1024), 2)
            raise ValidationError(
                f"Dung lượng lưu trữ hệ thống đã vượt quá giới hạn cho phép (tối đa {max_gb} GB).",
                code=AttachmentErrorCode.ATTACHMENT_STORAGE_QUOTA_EXCEEDED,
                details={
                    "file": [f"Dung lượng lưu trữ hệ thống đã vượt quá giới hạn cho phép ({max_gb} GB)."]
                },
            )

        # ============================================================
        # BƯỚC 3: Tính checksum, lưu vào kho theo chế độ xem rồi ghi DB (lỗi DB thì xóa file vừa lưu)
        # ============================================================
        digest = hashlib.sha256()
        for chunk in upload.chunks(_CHUNK_SIZE):
            digest.update(chunk)
        upload.seek(0)
        stored_name = self.storage_service.save_upload(visibility, upload)
        try:
            return self.repository.create(
                actor=actor,
                file=stored_name,
                visibility=visibility,
                original_name=(upload.name or "file")[:255],
                alt_text=(data.get("alt_text") or "").strip()[:255],
                content_type=content_type,
                size=upload.size or 0,
                checksum=digest.hexdigest(),
                folder=folder,
            )
        except Exception:
            self.storage_service.delete(visibility, stored_name)
            raise

    def find_alive_images(self, ids: Any) -> dict[str, Attachment]:
        """Ảnh còn tồn tại theo id (một query), dùng khi dựng nội dung công khai.

        Args:
            ids: Id attachment.

        Returns:
            `{id dạng chuỗi: attachment}`; id không tồn tại/không phải ảnh thì không có trong kết quả.
        """
        return {
            str(item.pk): item
            for item in self.repository.filter(pk__in=list(ids))
            if item.is_image and not item.is_private
        }

    def public_url(self, attachment: Attachment) -> str | None:
        """URL công khai của file (dùng trong nội dung công khai: trang, QR); file riêng tư trả None.

        Args:
            attachment: File.

        Returns:
            URL của kho công khai (tương đối khi dev) hoặc None.
        """
        if attachment.is_private:
            return None
        return self.storage_service.public_url(attachment)

    def get_content_for(self, actor: Any, pk: Any) -> Attachment:
        """File actor được mở nội dung (`GET /attachments/{id}/content`).

        File công khai: mọi người đã đăng nhập. File riêng tư: người upload, superuser hoặc
        `system.attachment.read_private`. Không đủ quyền và không tồn tại cùng là NotFoundError để không dò
        được file riêng tư nào tồn tại.

        Args:
            actor: Người dùng đã đăng nhập.
            pk: Id file.

        Returns:
            Attachment còn file vật lý.

        Raises:
            NotFoundError: Không tồn tại, đã xóa, đã dọn hoặc không có quyền.
        """
        attachment = self.repository.find_by_id(pk)
        if attachment is None or attachment.purged_at is not None:
            raise NotFoundError()
        if attachment.is_private and not (
            attachment.created_by_id == actor.pk
            or actor.has_perm(AttachmentPermission.FILE_READ_PRIVATE.code)
        ):
            raise NotFoundError()
        return attachment

    def set_visibility(self, actor: Any, pk: Any, visibility: str) -> Attachment:
        """Chuyển file giữa kho công khai và kho riêng tư (giữ id).

        Thứ tự an toàn: chép sang kho đích → cập nhật DB → sau commit mới xóa bản cũ. Lỗi khi chép hoặc ghi
        DB thì xóa bản chép, file cũ còn nguyên. Xóa bản cũ lỗi thì để bước dọn file mồ côi xử lý.

        Args:
            actor: Người thực hiện (owner hoặc `manage_all`).
            pk: Id file.
            visibility: Chế độ mới.

        Returns:
            Attachment sau khi chuyển.

        Raises:
            NotFoundError: Không tồn tại hoặc không có quyền.
            ValidationError: Kho riêng tư chưa cấu hình.
        """
        with transaction.atomic():
            attachment = self.get_for_write(actor, pk)
            source_visibility = attachment.visibility
            if (
                attachment.is_private
                and visibility != attachment.visibility
                and attachment.created_by_id != actor.pk
                and not actor.has_perm(AttachmentPermission.FILE_READ_PRIVATE.code)
            ):
                raise NotFoundError()
            old_name = attachment.file.name
            if source_visibility == visibility:
                return attachment
            new_name = self.storage_service.copy_to(attachment, visibility)
            try:
                updated = self.repository.update(
                    attachment, actor=actor, visibility=visibility, file=new_name
                )
            except Exception:
                self.storage_service.delete(visibility, new_name)
                raise
            transaction.on_commit(lambda: self.storage_service.delete(source_visibility, old_name))
        return updated

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
        visibility = instance.visibility

        self.repository.delete(instance, actor=actor)
        self.repository.mark_purged([instance.pk], timezone.now())
        self.storage_service.delete(visibility, file_name)

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
        upload = ContentFile(content, name=name)
        if detect_content_type(upload) != attachment.content_type:
            raise ValidationError(details={"file": ["Nội dung mới phải cùng định dạng với file cũ."]})
        stored_name = self.storage_service.save_upload(attachment.visibility, upload)
        updated = self.repository.update(
            attachment,
            actor=actor,
            file=stored_name,
            original_name=name[:255],
            size=len(content),
            checksum=hashlib.sha256(content).hexdigest(),
        )
        if old_file_name and old_file_name != stored_name:
            self.storage_service.delete(updated.visibility, old_file_name)
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
            self.repository.delete(attachment, actor=actor)
            self.repository.mark_purged([attachment.pk], timezone.now())
            self.storage_service.delete(attachment.visibility, file_name)

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
