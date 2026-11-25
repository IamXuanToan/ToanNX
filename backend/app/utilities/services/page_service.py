"""Nghiệp vụ trang tùy chỉnh: nội dung Tiptap, phiên bản, xem nháp theo quyền, bản công khai."""

from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.context.user_context import get_current_request
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.slug import generate_slug, normalize_slug
from app.core.utils.url import build_absolute_url
from app.system.models.attachment import Attachment
from app.system.services.attachment_service import AttachmentService
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.constants.page_templates import PAGE_TEMPLATES
from app.utilities.constants.public_cache import PUBLIC_CACHE_NAMESPACE, PUBLIC_CACHE_TTL_SECONDS
from app.utilities.constants.utilities_error_code import UtilitiesErrorCode
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission
from app.utilities.repositories.page_path_repository import PagePathRepository
from app.utilities.repositories.page_repository import PageRepository
from app.utilities.services.short_link_service import ShortLinkService
from app.utilities.validators.page_content_validator import PageContentRefs, validate_page_content
from app.utilities.validators.theme_validator import validate_theme

_SLUG_TAKEN = {"slug": ["Slug đã tồn tại trong đường dẫn giữa này."]}


class PageService(CoreCrudService[Page, PageRepository]):
    """Trang của owner; `manage_all` thấy của mọi người.

    Ảnh và link rút gọn trong trang phải thuộc chủ trang.
    """

    repository_class = PageRepository
    owner_field = "owner"
    owner_quota_setting = "CUSTOM_PAGE_MAX_PER_OWNER"
    manage_all_permission = PagePermission.MANAGE_ALL.code
    public_cache_namespace = PUBLIC_CACHE_NAMESPACE

    def __init__(
        self,
        repository: PageRepository | None = None,
        page_path_repository: PagePathRepository | None = None,
        attachment_service: AttachmentService | None = None,
        short_link_service: ShortLinkService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc trong module và service của module nền."""
        super().__init__(repository)
        self.page_path_repository = page_path_repository or PagePathRepository()
        self.attachment_service = attachment_service or AttachmentService()
        self.short_link_service = short_link_service or ShortLinkService()

    # ==================================================================
    # Đọc
    # ==================================================================
    def get_by_id_for(self, actor: Any, pk: Any) -> Page:
        """Chi tiết kèm `editor_content` (ảnh/link rút gọn đã dựng URL) để editor hiển thị."""
        page = super().get_by_id_for(actor, pk)
        page.editor_content = self._resolve(page, public=False)  # type: ignore[attr-defined]  # thuộc tính tạm
        return page

    def get_public(self, segment: str, slug: str, viewer: Any | None) -> dict[str, Any]:
        """Trang công khai; bản nháp chỉ trả cho người đọc được trang theo đúng luật API quản lý.

        Args:
            segment: Đoạn đường dẫn giữa.
            slug: Slug trang.
            viewer: Người đang xem (None = khách).

        Returns:
            Dữ liệu an toàn để render (không có id, owner).

        Raises:
            NotFoundError: Không có trang, hoặc chưa công khai mà người xem không có quyền (cùng một lỗi).

        Trang đã xuất bản giống nhau với mọi người xem nên được cache (Redis); bản nháp không bao giờ cache.
        """
        version = self.cache_service.namespace_version(PUBLIC_CACHE_NAMESPACE)
        key = None if version is None else f"{PUBLIC_CACHE_NAMESPACE}:{version}:page:{segment}:{slug}"
        cached = self.cache_service.get_json(key) if key else None
        if isinstance(cached, dict):
            return cached
        data = self._load_public(segment, slug, viewer)
        if key and not data["preview"]:
            self.cache_service.set_json(key, data, PUBLIC_CACHE_TTL_SECONDS)
        return data

    def _load_public(self, segment: str, slug: str, viewer: Any | None) -> dict[str, Any]:
        """Đọc trang công khai từ DB (xem `get_public`)."""
        page = self.repository.find_by_url(segment, slug)
        if page is None:
            raise NotFoundError()
        preview = page.status != Page.Status.PUBLISHED
        if preview and not self._can_preview(viewer, page):
            raise NotFoundError()

        avatar_url = self._image_url(page.avatar)
        cover_url = self._image_url(page.cover)
        content_cfg = page.content_config if isinstance(page.content_config, dict) else {}
        profile_obj = content_cfg.get("profile")
        profile_cfg: dict[str, Any] = profile_obj if isinstance(profile_obj, dict) else {}

        if not avatar_url:
            raw_avatar = (
                content_cfg.get("avatar_url")
                or content_cfg.get("avatarUrl")
                or profile_cfg.get("avatar_url")
                or profile_cfg.get("avatarUrl")
            )
            if raw_avatar and isinstance(raw_avatar, str):
                avatar_url = raw_avatar

        if not cover_url:
            raw_cover = (
                content_cfg.get("cover_url")
                or content_cfg.get("coverUrl")
                or profile_cfg.get("cover_url")
                or profile_cfg.get("coverUrl")
            )
            if raw_cover and isinstance(raw_cover, str):
                cover_url = raw_cover

        return {
            "id": str(page.id),
            "segment": page.path.segment,
            "slug": page.slug,
            "status": page.status,
            "preview": preview,
            "title": page.title,
            "description": page.description,
            "canonical_url": self.public_url(page),
            "seo_title": page.seo_title or page.title,
            "seo_description": page.seo_description or page.description,
            "avatar_url": avatar_url,
            "cover_url": cover_url,
            "theme": page.theme,
            "page_type": page.page_type,
            "template_key": page.template_key,
            "template_version": page.template_version,
            "content_config": self._strip_qr_secrets(page.content_config),
            "style_config": page.style_config or {},
            "responsive_config": page.responsive_config or {},
            "content": self._resolve(page, public=True),
        }

    def public_url(self, page: Page) -> str:
        """URL công khai tuyệt đối `/<segment>/<slug>` trên frontend."""
        request = get_current_request()
        return f"{get_frontend_origin(request)}/{page.path.segment}/{page.slug}"

    # ==================================================================
    # Ghi
    # ==================================================================
    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Page:
        """Tạo trang (owner = actor), nội dung từ `content` hoặc mẫu `template`."""
        fields = dict(data)
        fields["path"] = self._active_path(fields.pop("path_id"))
        fields["slug"] = (
            normalize_slug(fields["slug"], preserve_case=True) if fields.get("slug") else generate_slug()
        )
        template = fields.pop("template", "blank")
        fields["content"] = self._checked_content(
            actor, fields.get("content") or PAGE_TEMPLATES[template], actor=actor
        )
        self._prepare(actor, fields, current_status=None, actor=actor)
        try:
            return super().create(actor, fields)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError("Slug đã được sử dụng.", details=_SLUG_TAKEN) from exc

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Page:
        """Sửa trang; sửa nội dung phải gửi đúng `content_version` (lệch → 409)."""
        page = self.get_for_write(actor, pk)
        fields = dict(data)
        version = fields.pop("content_version", None)
        if "content" in fields:
            if version != page.content_version:
                raise ConflictError(
                    "Trang đã được sửa ở nơi khác. Tải lại để xem bản mới nhất.",
                    code=UtilitiesErrorCode.PAGE_VERSION_CONFLICT,
                    details={"content_version": page.content_version},
                )
            fields["content"] = self._checked_content(page.owner, fields["content"], actor=actor)
            fields["content_version"] = page.content_version + 1
        if "path_id" in fields:
            path_id = fields.pop("path_id")
            if str(path_id) != str(page.path_id):
                fields["path"] = self._active_path(path_id)
        if "slug" in fields:
            fields["slug"] = normalize_slug(fields["slug"], preserve_case=True)
        self._prepare(page.owner, fields, current_status=page.status, actor=actor)
        try:
            updated = self.repository.update(page, actor=actor, **fields)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError("Slug đã được sử dụng.", details=_SLUG_TAKEN) from exc
        self.invalidate_public_cache()
        return updated

    @transaction.atomic
    def duplicate(self, actor: Any, pk: Any) -> Page:
        """Nhân bản thành bản nháp của actor; bỏ tham chiếu ngoại và token webhook bí mật khỏi bản sao."""
        source = super().get_by_id_for(actor, pk)
        content = source.content
        if source.owner_id != actor.pk:
            content = self._drop_foreign_refs(actor, content)
        content_config = self._strip_qr_secrets(source.content_config)
        return self.create(
            actor,
            {
                "path_id": source.path_id,
                "title": f"{source.title} (bản sao)"[:150],
                "description": source.description,
                "seo_title": source.seo_title,
                "seo_description": source.seo_description,
                "theme": source.theme,
                "page_type": source.page_type,
                "template_key": source.template_key,
                "template_version": source.template_version,
                "content_config": content_config,
                "style_config": source.style_config,
                "responsive_config": source.responsive_config,
                "content": content,
            },
        )

    @staticmethod
    def _strip_qr_secrets(config: Any) -> dict[str, Any]:
        """Xóa token bí mật (`webhookToken`/`webhook_token`) của mã QR khi trả công khai hoặc nhân bản."""
        if not isinstance(config, dict):
            return {}
        cloned = dict(config)
        for key in ("qrCodes", "qr_codes"):
            items = cloned.get(key)
            if isinstance(items, list):
                cleaned: list[Any] = []
                for item in items:
                    if isinstance(item, dict):
                        entry = {k: v for k, v in item.items() if k not in ("webhookToken", "webhook_token")}
                        cleaned.append(entry)
                    else:
                        cleaned.append(item)
                cloned[key] = cleaned
        return cloned

    # ==================================================================
    # Nội bộ
    # ==================================================================
    def _can_preview(self, viewer: Any | None, page: Page) -> bool:
        """Người đọc được trang ở API quản lý (quyền đọc + owner/manage_all)."""
        return bool(
            viewer is not None
            and getattr(viewer, "is_authenticated", False)
            and viewer.has_perm(PagePermission.READ.code)
            and self.can_access(viewer, page)
        )

    def _active_path(self, path_id: Any) -> Any:
        """Đường dẫn giữa còn tồn tại và đang bật."""
        path = self.page_path_repository.get_by_id(path_id)
        if not path.is_active:
            raise BusinessRuleError("Đường dẫn giữa đang tắt.", code=UtilitiesErrorCode.PAGE_PATH_INACTIVE)
        return path

    def _prepare(
        self, owner: Any, fields: dict[str, Any], current_status: str | None, actor: Any | None = None
    ) -> None:
        """Theme, ảnh đại diện/bìa (phải của owner hoặc actor có quyền), mốc công khai."""
        if "theme" in fields:
            fields["theme"] = validate_theme(fields["theme"])
        for source, target in (("avatar_id", "avatar"), ("cover_id", "cover")):
            if source in fields:
                attachment_id = fields.pop(source)
                fields[target] = (
                    None
                    if attachment_id is None
                    else self._owned_image(owner, attachment_id, source, actor=actor)
                )
        if fields.get("status") == Page.Status.PUBLISHED and current_status != Page.Status.PUBLISHED:
            fields["published_at"] = timezone.now()

    def _owned_image(
        self, owner: Any, attachment_id: Any, field: str, actor: Any | None = None
    ) -> Attachment:
        """Ảnh phải còn tồn tại và thuộc chủ trang (hoặc file công khai / actor có quyền quản trị)."""
        image = self.attachment_service.find_alive_images([attachment_id]).get(str(attachment_id))
        allowed_owners = {owner.pk}
        if actor is not None and (
            getattr(actor, "is_superuser", False) or actor.has_perm(PagePermission.MANAGE_ALL.code)
        ):
            allowed_owners.add(actor.pk)
        if image is None:
            raise ValidationError(details={field: ["Ảnh không tồn tại hoặc đã bị xóa."]})
        is_public = getattr(image, "visibility", None) == Attachment.Visibility.PUBLIC
        if not is_public and image.created_by_id not in allowed_owners:
            raise ValidationError(details={field: ["Ảnh không tồn tại hoặc không thuộc chủ trang."]})
        return image

    def _checked_content(self, owner: Any, content: Any, actor: Any | None = None) -> dict[str, Any]:
        """Validate tài liệu và kiểm ảnh/link rút gọn thuộc chủ trang."""
        document, refs = validate_page_content(content)
        self._check_refs(owner, refs, actor=actor)
        return document

    def _check_refs(self, owner: Any, refs: PageContentRefs, actor: Any | None = None) -> None:
        allowed_owners = {owner.pk}
        if actor is not None and (
            getattr(actor, "is_superuser", False) or actor.has_perm(PagePermission.MANAGE_ALL.code)
        ):
            allowed_owners.add(actor.pk)
        images = self.attachment_service.find_alive_images(refs.attachment_ids)
        foreign = [
            pk
            for pk in refs.attachment_ids
            if pk not in images or images[pk].created_by_id not in allowed_owners
        ]
        if foreign:
            raise ValidationError(details={"content": [f"Ảnh không thuộc chủ trang: {sorted(foreign)}."]})
        links = self.short_link_service.find_by_ids(refs.short_link_ids)
        foreign = [
            pk for pk in refs.short_link_ids if pk not in links or links[pk].owner_id not in allowed_owners
        ]
        if foreign:
            raise ValidationError(
                details={"content": [f"Link rút gọn không thuộc chủ trang: {sorted(foreign)}."]}
            )

    def _drop_foreign_refs(self, owner: Any, content: dict[str, Any]) -> dict[str, Any]:
        """Bỏ node ảnh/nút tham chiếu tài nguyên không thuộc `owner`."""
        _, refs = validate_page_content(content)
        images = self.attachment_service.find_alive_images(refs.attachment_ids)
        links = self.short_link_service.find_by_ids(refs.short_link_ids)
        own_images = {pk for pk, item in images.items() if item.created_by_id == owner.pk}
        own_links = {pk for pk, item in links.items() if item.owner_id == owner.pk}

        def keep(node: dict[str, Any]) -> dict[str, Any] | None:
            attrs = node.get("attrs", {})
            if (
                node["type"] == "image"
                and attrs.get("attachmentId")
                and attrs["attachmentId"] not in own_images
            ):
                return None
            if (
                node["type"] == "button"
                and attrs.get("shortLinkId")
                and attrs["shortLinkId"] not in own_links
            ):
                return None
            return node

        return _transform(content, keep) or {"type": "doc", "content": [{"type": "paragraph"}]}

    def _resolve(self, page: Page, *, public: bool) -> dict[str, Any]:
        """Dựng URL ảnh Thư viện và link rút gọn hiện tại.

        Công khai: ảnh đã xóa và link rút gọn tắt/hết hạn/xóa thì bỏ node (trang vẫn 200).
        Editor: giữ node để người sửa thấy và thay.
        """
        document = page.content or {"type": "doc", "content": []}
        try:
            _, refs = validate_page_content(document)
        except ValidationError:
            return {"type": "doc", "content": []}
        images = self.attachment_service.find_alive_images(refs.attachment_ids)
        links = self.short_link_service.find_by_ids(refs.short_link_ids)

        def resolve(node: dict[str, Any]) -> dict[str, Any] | None:
            attrs = dict(node.get("attrs", {}))
            if node["type"] == "image" and attrs.get("attachmentId"):
                image = images.get(attrs["attachmentId"])
                if image is None or image.created_by_id != page.owner_id:
                    return None if public else {**node, "attrs": {**attrs, "src": ""}}
                return {**node, "attrs": {**attrs, "src": build_absolute_url(image.file.url)}}
            if node["type"] == "button" and attrs.get("shortLinkId"):
                link = links.get(attrs["shortLinkId"])
                usable = link is not None and self.short_link_service.is_resolvable(link)
                if public and not usable:
                    return None
                href = build_absolute_url(f"/s/{link.slug}") if link is not None else ""
                return {**node, "attrs": {**attrs, "href": href}}
            return node

        return _transform(document, resolve) or {"type": "doc", "content": []}

    @staticmethod
    def _image_url(attachment: Attachment | None) -> str | None:
        """URL ảnh công khai còn tồn tại; không lộ id attachment, bỏ ảnh riêng tư khỏi trang công khai."""
        usable = attachment is not None and attachment.deleted_at is None and not attachment.is_private
        return build_absolute_url(attachment.file.url) if usable and attachment is not None else None


def _transform(node: dict[str, Any], visit: Any) -> dict[str, Any] | None:
    """Duyệt cây Tiptap, `visit` trả node mới hoặc None để bỏ node."""
    result = visit(node)
    if result is None:
        return None
    children = result.get("content")
    if children:
        result = {**result, "content": [item for child in children if (item := _transform(child, visit))]}
    return result
