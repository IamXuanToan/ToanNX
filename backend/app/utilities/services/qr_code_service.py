"""Nghiệp vụ mã QR: dựng payload, vẽ ảnh, lưu ảnh vào Thư viện và cập nhật tại chỗ."""

from typing import Any

from django.db import transaction

from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.text import ascii_slug
from app.system.models.attachment import Attachment
from app.system.services.attachment_service import AttachmentService
from app.utilities.constants.public_cache import PUBLIC_CACHE_NAMESPACE
from app.utilities.models.qr_code import QrCode
from app.utilities.permissions.qr_code_permission import QrCodePermission
from app.utilities.repositories.qr_code_repository import QrCodeRepository
from app.utilities.utils.qr_content import build_payload, validate_qr_content
from app.utilities.utils.qr_image_renderer import render_png, render_svg_data_url

DEFAULT_FILE_NAME = "qr-code"
LOGO_CONTENT_TYPES = frozenset({"image/png", "image/jpeg", "image/webp", "image/gif"})


class QrCodeService(CoreCrudService[QrCode, QrCodeRepository]):
    """Ảnh PNG của mã QR là một Attachment của owner; sửa mã thì thay nội dung, giữ id ảnh."""

    repository_class = QrCodeRepository
    owner_field = "owner"
    manage_all_permission = QrCodePermission.MANAGE_ALL.code
    owner_quota_setting = "QR_CODE_MAX_PER_OWNER"
    public_cache_namespace = PUBLIC_CACHE_NAMESPACE

    def __init__(
        self, repository: QrCodeRepository | None = None, attachment_service: AttachmentService | None = None
    ) -> None:
        """Khởi tạo repository và service Thư viện."""
        super().__init__(repository)
        self.attachment_service = attachment_service or AttachmentService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> QrCode:
        """Tạo mã QR và ảnh của nó trong Thư viện của actor.

        Args:
            actor: Người tạo (owner).
            data: Dữ liệu đã validate (`content`, `design` đã chuẩn hóa theo loại).

        Returns:
            Mã QR mới.
        """
        self.ensure_quota(actor)
        fields = dict(data)
        logo = self._get_logo(actor, fields.pop("logo_id", None))
        fields["design"] = self._design_for_logo(fields["design"], logo)
        payload = build_payload(fields["qr_type"], fields["content"])
        image = self.attachment_service.create_generated(
            actor,
            render_png(payload, fields["design"], self._logo_bytes(logo)),
            self._file_name(fields["name"]),
        )
        qr_code = self.repository.create(
            actor=actor, owner=actor, payload=payload, image=image, logo=logo, **fields
        )
        self.invalidate_public_cache()
        return qr_code

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> QrCode:
        """Sửa mã QR; đổi nội dung/kiểu dáng thì vẽ lại ảnh trong cùng attachment.

        Args:
            actor: Người thực hiện.
            pk: Id mã QR.
            data: Trường cần đổi (partial).

        Returns:
            Mã QR sau cập nhật.
        """
        qr_code = self.get_for_write(actor, pk)
        fields = dict(data)
        logo_changed = "logo_id" in fields
        requested_logo_id = fields.pop("logo_id") if logo_changed else None
        logo = (
            qr_code.logo
            if not logo_changed or (requested_logo_id and str(requested_logo_id) == str(qr_code.logo_id))
            else self._get_logo(actor, requested_logo_id)
        )
        if logo_changed:
            fields["logo"] = logo
        if {"qr_type", "content", "design"} & set(fields) or logo_changed:
            qr_type = fields.get("qr_type", qr_code.qr_type)
            fields["content"], fields["design"] = validate_qr_content(
                qr_type, fields.get("content", qr_code.content), fields.get("design", qr_code.design)
            )
            fields["design"] = self._design_for_logo(fields["design"], logo)
            fields["payload"] = build_payload(qr_type, fields["content"])
            if (fields["payload"], fields["design"], logo) != (qr_code.payload, qr_code.design, qr_code.logo):
                self.attachment_service.replace_content(
                    actor,
                    qr_code.image_id,
                    render_png(fields["payload"], fields["design"], self._logo_bytes(logo)),
                    self._file_name(fields.get("name", qr_code.name)),
                )
        updated = self.repository.update(qr_code, actor=actor, **fields)
        self.invalidate_public_cache()
        return updated

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm mã QR và ảnh của nó (trang đang chèn ảnh sẽ bỏ ảnh khi hiển thị).

        Args:
            actor: Người thực hiện.
            pk: Id mã QR.
        """
        qr_code = self.get_for_write(actor, pk)
        self.repository.delete(qr_code, actor=actor)
        self.attachment_service.delete_generated(actor, qr_code.image_id)
        self.invalidate_public_cache()

    def preview(
        self, actor: Any, qr_type: str, data: dict[str, Any], style: dict[str, Any], logo_id: Any = None
    ) -> dict[str, str]:
        """Payload và ảnh SVG xem trước, không ghi DB.

        Args:
            actor: Người yêu cầu xem trước.
            qr_type: Loại.
            data: Dữ liệu đã validate.
            style: Kiểu dáng đã validate.
            logo_id: Id ảnh logo tùy chọn.

        Returns:
            `{payload, svg}` (svg là data URL).
        """
        logo = self._get_logo(actor, logo_id)
        payload = build_payload(qr_type, data)
        return {
            "payload": payload,
            "svg": render_svg_data_url(payload, self._design_for_logo(style, logo), self._logo_bytes(logo)),
        }

    def _get_logo(self, actor: Any, logo_id: Any) -> Attachment | None:
        """Chỉ cho dùng ảnh raster trong Thư viện mà actor được phép đọc."""
        if logo_id is None:
            return None
        logo = self.attachment_service.get_image(logo_id, actor=actor)
        if logo.content_type not in LOGO_CONTENT_TYPES:
            raise ValidationError(details={"logo_id": ["Logo phải là ảnh PNG, JPEG, WebP hoặc GIF."]})
        return logo

    @staticmethod
    def _logo_bytes(logo: Attachment | None) -> bytes | None:
        """Đọc logo từ storage khi dựng hoặc xem trước mã QR."""
        if logo is None:
            return None
        with logo.file.open("rb") as source:
            return source.read()

    @staticmethod
    def _design_for_logo(design: dict[str, Any], logo: Attachment | None) -> dict[str, Any]:
        """Logo cần mức sửa lỗi H và quiet zone bốn mô đun của QR chuẩn."""
        return {**design, "error_correction": "H", "margin": max(4, design["margin"])} if logo else design

    @staticmethod
    def _file_name(name: str) -> str:
        """Tên file ảnh theo tên mã QR."""
        return f"{ascii_slug(name)[:60] or DEFAULT_FILE_NAME}.png"
