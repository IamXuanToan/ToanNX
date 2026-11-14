"""Nghiệp vụ trang tùy chỉnh."""

from typing import Any

from django.conf import settings
from django.db import transaction

from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.utils.absolute_url import build_absolute_url
from app.core.utils.slug import generate_slug, normalize_slug
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.authentication.services.rate_limit_service import RateLimitService
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.models.page_block import PageBlock
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission
from app.modules.custom_pages.repositories.page_repository import PageRepository
from app.modules.custom_pages.validators.page_content import validate_theme
from app.modules.iam.services.owned_crud_service import OwnedCrudService


class PageService(OwnedCrudService[Page, PageRepository]):
    """Tạo, sửa, xóa và xuất bản trang cá nhân."""

    repository_class = PageRepository
    manage_all_permission = CustomPagesPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: PageRepository | None = None,
        attachment_service: AttachmentService | None = None,
        rate_limit_service: RateLimitService | None = None,
    ) -> None:
        """Khởi tạo repository và service ảnh."""
        super().__init__(repository)
        self.attachment_service = attachment_service or AttachmentService()
        self.rate_limit_service = rate_limit_service or RateLimitService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Page:
        """Tạo trang với owner là actor, xử lý ảnh và theme."""
        fields = dict(data)
        fields["slug"] = normalize_slug(fields["slug"]) if fields.get("slug") else generate_slug()
        self._prepare_fields(actor, fields)
        self.rate_limit_service.hit(
            f"custom-page-create:{actor.pk}", settings.CUSTOM_PAGE_CREATE_RATE_LIMIT, 3600
        )
        try:
            page = super().create(actor, fields)
        except ConflictError as exc:
            raise ConflictError("Slug đã được sử dụng.", details={"slug": ["Slug đã tồn tại."]}) from exc
        return self.repository.get_by_id(page.pk)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Page:
        """Kiểm tra owner, ảnh và theme rồi cập nhật."""
        current = self.get_by_id_for(actor, pk)
        fields = dict(data)
        if "slug" in fields:
            fields["slug"] = normalize_slug(fields["slug"])
        self._prepare_fields(current.owner, fields)
        try:
            page = super().update(actor, pk, fields)
        except ConflictError as exc:
            raise ConflictError("Slug đã được sử dụng.", details={"slug": ["Slug đã tồn tại."]}) from exc
        return self.repository.get_by_id(page.pk)

    def _prepare_fields(self, owner: Any, fields: dict[str, Any]) -> None:
        """Đổi attachment id thành object sau khi kiểm tra owner và loại ảnh."""
        if "theme" in fields:
            fields["theme"] = validate_theme(fields["theme"])
        for source, target in (("avatar_id", "avatar"), ("cover_id", "cover")):
            if source in fields:
                attachment_id = fields.pop(source)
                fields[target] = None if attachment_id is None else self._owned_image(owner, attachment_id)

    def _owned_image(self, owner: Any, attachment_id: Any) -> Attachment:
        """Ảnh phải là attachment chưa xóa do chính owner upload."""
        attachment = self.attachment_service.get_image(attachment_id)
        if attachment.created_by_id != owner.pk:
            raise NotFoundError()
        return attachment

    def get_public(self, slug: str) -> dict[str, Any]:
        """Chỉ xuất bản page PUBLISHED, block đang hiện và ảnh hợp lệ."""
        page = self.repository.find_one(slug=normalize_slug(slug), status=Page.Status.PUBLISHED)
        if page is None:
            raise NotFoundError()
        canonical_url = build_absolute_url(f"/p/{page.slug}")
        blocks = []
        for block in page.blocks.all():
            if block.is_visible:
                resolved = self._public_block(page, block, canonical_url)
                if resolved is not None:
                    blocks.append(resolved)
        return {
            "title": page.title,
            "description": page.description,
            "canonical_url": canonical_url,
            "seo_title": page.seo_title or page.title,
            "seo_description": page.seo_description or page.description,
            "avatar_url": self._image_url(page.avatar),
            "cover_url": self._image_url(page.cover),
            "theme": page.theme,
            "blocks": blocks,
        }

    @staticmethod
    def _image_url(attachment: Attachment | None) -> str | None:
        """URL ảnh còn tồn tại; không lộ id attachment."""
        return (
            build_absolute_url(attachment.file.url) if attachment and attachment.deleted_at is None else None
        )

    def _public_block(self, page: Page, block: PageBlock, canonical_url: str) -> dict[str, Any] | None:
        """Dựng block công khai không chứa id nội bộ hay dữ liệu quản trị."""
        content = dict(block.content)
        if block.block_type == PageBlock.Type.IMAGE:
            try:
                attachment = self._owned_image(page.owner, content["attachment_id"])
            except NotFoundError:
                return None
            content = {"url": build_absolute_url(attachment.file.url), "alt": content["alt"]}
        elif block.block_type == PageBlock.Type.QR_CODE:
            payload = canonical_url if content["target_type"] == "PAGE" else content["target_url"]
            content = {"label": content["label"], "qr_payload": payload}
        return {"block_type": block.block_type, "content": content, "position": block.position}
