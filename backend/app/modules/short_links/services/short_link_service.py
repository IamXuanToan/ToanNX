"""Nghiệp vụ liên kết rút gọn."""

from typing import Any
from urllib.parse import urlsplit

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.utils.slug import generate_slug, normalize_slug
from app.core.utils.url import validate_public_url
from app.modules.authentication.services.rate_limit_service import RateLimitService
from app.modules.iam.services.owned_crud_service import OwnedCrudService
from app.modules.short_links.exceptions.short_link_expired_error import ShortLinkExpiredError
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_links_permission import ShortLinksPermission
from app.modules.short_links.repositories.short_link_repository import ShortLinkRepository


class ShortLinkService(OwnedCrudService[ShortLink, ShortLinkRepository]):
    """Tạo, sửa, xóa và giải quyết liên kết công khai."""

    repository_class = ShortLinkRepository
    manage_all_permission = ShortLinksPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: ShortLinkRepository | None = None,
        rate_limit_service: RateLimitService | None = None,
    ) -> None:
        """Khởi tạo repository và rate limiter PostgreSQL sẵn có."""
        super().__init__(repository)
        self.rate_limit_service = rate_limit_service or RateLimitService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> ShortLink:
        """Chuẩn hóa slug và URL, chặn liên kết nội bộ có thể tạo vòng lặp."""
        fields = dict(data)
        fields["slug"] = normalize_slug(fields["slug"]) if fields.get("slug") else generate_slug()
        fields["destination_url"] = self._validate_destination(fields["destination_url"])
        self._validate_expiration(fields.get("expires_at"))
        self.rate_limit_service.hit(
            f"short-link-create:{actor.pk}", settings.SHORT_LINK_CREATE_RATE_LIMIT, 3600
        )
        try:
            return super().create(actor, fields)
        except ConflictError as exc:
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
            raise ConflictError("Slug đã được sử dụng.", details={"slug": ["Slug đã tồn tại."]}) from exc

    def resolve(self, slug: str) -> tuple[str, int]:
        """Trả URL đích và mã 301/302 của link đang hoạt động; link hết hạn trả 410."""
        link = self.repository.find_one(slug=normalize_slug(slug))
        if link is None or link.status != ShortLink.Status.ACTIVE:
            raise NotFoundError()
        if link.expires_at is not None and link.expires_at <= timezone.now():
            raise ShortLinkExpiredError()
        return self._validate_destination(link.destination_url), link.redirect_type

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
