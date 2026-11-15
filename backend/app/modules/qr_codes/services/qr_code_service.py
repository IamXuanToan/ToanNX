"""Nghiệp vụ mã QR: dựng payload, vẽ ảnh, lưu ảnh vào Thư viện và cập nhật tại chỗ."""

from typing import Any

from django.db import transaction
from django.utils.text import slugify

from app.core.services.core_crud_service import CoreCrudService
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.qr_codes.models.qr_code import QrCode
from app.modules.qr_codes.permissions.qr_codes_permission import QrCodesPermission
from app.modules.qr_codes.repositories.qr_code_repository import QrCodeRepository
from app.modules.qr_codes.utils.qr_content import build_payload, validate_qr_content
from app.modules.qr_codes.utils.qr_image_renderer import render_png, render_svg_data_url

DEFAULT_FILE_NAME = "qr-code"


class QrCodeService(CoreCrudService[QrCode, QrCodeRepository]):
    """Ảnh PNG của mã QR là một Attachment của owner; sửa mã thì thay nội dung, giữ id ảnh."""

    repository_class = QrCodeRepository
    owner_field = "owner"
    manage_all_permission = QrCodesPermission.MANAGE_ALL.code
    owner_quota_setting = "QR_CODE_MAX_PER_OWNER"

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
        payload = build_payload(data["qr_type"], data["content"])
        image = self.attachment_service.create_generated(
            actor, render_png(payload, data["design"]), self._file_name(data["name"])
        )
        return self.repository.create(actor=actor, owner=actor, payload=payload, image=image, **data)

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
        if {"qr_type", "content", "design"} & set(fields):
            qr_type = fields.get("qr_type", qr_code.qr_type)
            fields["content"], fields["design"] = validate_qr_content(
                qr_type, fields.get("content", qr_code.content), fields.get("design", qr_code.design)
            )
            fields["payload"] = build_payload(qr_type, fields["content"])
            if (fields["payload"], fields["design"]) != (qr_code.payload, qr_code.design):
                self.attachment_service.replace_content(
                    actor,
                    qr_code.image_id,
                    render_png(fields["payload"], fields["design"]),
                    self._file_name(fields.get("name", qr_code.name)),
                )
        return self.repository.update(qr_code, actor=actor, **fields)

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm mã QR và ảnh của nó (trang đang chèn ảnh sẽ bỏ ảnh khi hiển thị).

        Args:
            actor: Người thực hiện.
            pk: Id mã QR.
        """
        qr_code = self.get_for_write(actor, pk)
        self.repository.soft_delete(qr_code, actor=actor)
        self.attachment_service.delete_generated(actor, qr_code.image_id)

    @staticmethod
    def preview(qr_type: str, data: dict[str, Any], style: dict[str, Any]) -> dict[str, str]:
        """Payload và ảnh SVG xem trước, không ghi DB.

        Args:
            qr_type: Loại.
            data: Dữ liệu đã validate.
            style: Kiểu dáng đã validate.

        Returns:
            `{payload, svg}` (svg là data URL).
        """
        payload = build_payload(qr_type, data)
        return {"payload": payload, "svg": render_svg_data_url(payload, style)}

    @staticmethod
    def _file_name(name: str) -> str:
        """Tên file ảnh theo tên mã QR."""
        return f"{slugify(name)[:60] or DEFAULT_FILE_NAME}.png"
