"""Nghiệp vụ liên kết rút gọn."""

from typing import Any
from urllib.parse import urlsplit

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.slug import generate_slug, normalize_slug
from app.core.utils.url import validate_public_url
from app.modules.short_links.exceptions.short_link_expired_error import ShortLinkExpiredError
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_links_permission import ShortLinksPermission
from app.modules.short_links.repositories.short_link_repository import ShortLinkRepository


class ShortLinkService(CoreCrudService[ShortLink, ShortLinkRepository]):
    """Tạo, sửa, xóa và giải quyết liên kết công khai."""

    repository_class = ShortLinkRepository
    owner_field = "owner"
    owner_quota_setting = "SHORT_LINK_MAX_PER_OWNER"
    manage_all_permission = ShortLinksPermission.MANAGE_ALL.code

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> ShortLink:
        """Chuẩn hóa slug và URL, chặn liên kết nội bộ có thể tạo vòng lặp."""
        fields = dict(data)
        fields["slug"] = normalize_slug(fields["slug"]) if fields.get("slug") else generate_slug()
        fields["destination_url"] = self._validate_destination(fields["destination_url"])
        self._validate_expiration(fields.get("expires_at"))
        try:
            return super().create(actor, fields)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError("Slug đã được sử dụng.", details={"slug": ["Slug đã tồn tại."]}) from exc

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> ShortLink:
        """Kiểm tra URL/slug/expiration trước khi sửa trong transaction."""
        fields = dict(data)
        if "slug" in fields:
            fields["slug"] = normalize_slug(fields["slug"])
        if "destination_url" in fields:
            fields["destination_url"] = self._validate_destination(fields["destination_url"])
        if "expires_at" in fields:
            self._validate_expiration(fields["expires_at"])
        try:
            return super().update(actor, pk, fields)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError("Slug đã được sử dụng.", details={"slug": ["Slug đã tồn tại."]}) from exc

    def resolve(self, slug: str) -> tuple[str, int]:
        """Trả URL đích và mã 301/302 của link đang hoạt động; link hết hạn trả 410."""
        try:
            normalized = normalize_slug(slug)
        except ValidationError as exc:
            raise NotFoundError() from exc
        link = self.repository.find_one(slug=normalized)
        if link is None or link.status != ShortLink.Status.ACTIVE:
            raise NotFoundError()
        if link.expires_at is not None and link.expires_at <= timezone.now():
            raise ShortLinkExpiredError()
        return self._validate_destination(link.destination_url), link.redirect_type

    def find_by_ids(self, ids: Any) -> dict[str, ShortLink]:
        """Link còn tồn tại theo id (một query), dùng cho nút link rút gọn trong module khác.

        Args:
            ids: Id link.

        Returns:
            `{id dạng chuỗi: link}`.
        """
        return {str(item.pk): item for item in self.repository.filter(pk__in=list(ids))}

    @staticmethod
    def is_resolvable(link: ShortLink) -> bool:
        """Link đang hoạt động và chưa hết hạn.

        Args:
            link: Link.

        Returns:
            True nếu `/s/{slug}` sẽ chuyển hướng được.
        """
        return link.status == ShortLink.Status.ACTIVE and (
            link.expires_at is None or link.expires_at > timezone.now()
        )

    @staticmethod
    def _validate_expiration(value: Any) -> None:
        """Ngày hết hạn phải ở tương lai khi được nhập."""
        if value is not None and value <= timezone.now():
            raise ValidationError(details={"expires_at": ["Thời điểm hết hạn phải ở tương lai."]})

    @staticmethod
    def _validate_destination(value: str) -> str:
        """Chỉ HTTP/HTTPS; cấm trỏ vào `/s/` nội bộ để tránh chuỗi/vòng redirect."""
        url = validate_public_url(value)
        parts = urlsplit(url)
        if (
            parts.hostname
            and parts.hostname.lower() in settings.SHORT_LINK_INTERNAL_HOSTS
            and parts.path.startswith("/s/")
        ):
            raise ValidationError(details={"destination_url": ["Không thể trỏ đến Short Link nội bộ."]})
        return url
