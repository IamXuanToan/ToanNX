"""Nghiệp vụ liên kết rút gọn."""

from typing import Any
from urllib.parse import urlsplit
from uuid import uuid4

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.slug import normalize_slug
from app.core.utils.url import validate_public_url
from app.utilities.constants.public_cache import (
    PUBLIC_CACHE_NAMESPACE,
    PUBLIC_CACHE_TTL_SECONDS,
    PUBLIC_MISSING_TTL_SECONDS,
)
from app.utilities.exceptions.short_link_expired_error import ShortLinkExpiredError
from app.utilities.exceptions.short_link_password_error import ShortLinkPasswordError
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission
from app.utilities.repositories.short_link_repository import ShortLinkRepository

# Giá trị giữ chỗ cho `password_hash` của link dựng từ cache (không phải mã băm, không dùng để kiểm mật khẩu).
LOCKED_MARKER = "!cached-locked"


class ShortLinkService(CoreCrudService[ShortLink, ShortLinkRepository]):
    """Tạo, sửa, xóa và giải quyết liên kết công khai."""

    repository_class = ShortLinkRepository
    owner_field = "owner"
    owner_quota_setting = "SHORT_LINK_MAX_PER_OWNER"
    manage_all_permission = ShortLinkPermission.MANAGE_ALL.code
    public_cache_namespace = PUBLIC_CACHE_NAMESPACE

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> ShortLink:
        """Chuẩn hóa slug và URL, chặn liên kết nội bộ có thể tạo vòng lặp."""
        fields = dict(data)
        fields["slug"] = normalize_slug(fields["slug"]) if fields.get("slug") else str(uuid4())
        fields["destination_url"] = self._validate_destination(fields["destination_url"])
        self._validate_expiration(fields.get("expires_at"))
        password = fields.pop("password", "")
        fields["password_hash"] = make_password(password) if password else ""
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
        if "password" in fields:
            password = fields.pop("password")
            fields["password_hash"] = make_password(password) if password else ""
        try:
            return super().update(actor, pk, fields)
        except ConflictError as exc:
            if exc.code != ErrorCode.CONFLICT:
                raise
            raise ConflictError("Slug đã được sử dụng.", details={"slug": ["Slug đã tồn tại."]}) from exc

    def get_public_link(self, slug: str) -> ShortLink:
        """Lấy link công khai còn hiệu lực; bản tắt/xóa trả 404, hết hạn trả 410.

        Có Redis thì đọc cache trước (lượt khách không chạm DB). Bản lấy từ cache là `ShortLink` **chưa lưu**
        chỉ mang các trường công khai; link có mật khẩu chỉ mang cờ "có mật khẩu", không có mã băm và URL
        đích — `unlock` luôn đọc DB.

        Args:
            slug: Slug người xem truy cập.

        Returns:
            Link còn hiệu lực.
        """
        try:
            normalized = normalize_slug(slug)
        except ValidationError as exc:
            raise NotFoundError() from exc
        key = self._public_cache_key(normalized)
        cached = self.cache_service.get_json(key) if key else None
        if isinstance(cached, dict):
            return self._from_public_cache(cached)
        try:
            link = self._load_public_link(normalized)
        except NotFoundError:
            if key:
                self.cache_service.set_json(key, {"missing": True}, PUBLIC_MISSING_TTL_SECONDS)
            raise
        if key:
            self._store_public_cache(key, link)
        return link

    def _load_public_link(self, normalized: str) -> ShortLink:
        """Đọc link công khai từ DB (slug đã chuẩn hóa)."""
        link = self.repository.find_one(slug=normalized)
        if link is None or link.status != ShortLink.Status.ACTIVE:
            raise NotFoundError()
        if link.expires_at is not None and link.expires_at <= timezone.now():
            raise ShortLinkExpiredError()
        self._validate_destination(link.destination_url)
        return link

    def unlock(self, slug: str, password: str) -> str:
        """Kiểm mật khẩu và chỉ sau đó mới tiết lộ URL đích.

        Args:
            slug: Slug người xem truy cập.
            password: Mật khẩu do người xem nhập.

        Returns:
            URL đích hợp lệ.
        """
        try:
            normalized = normalize_slug(slug)
        except ValidationError as exc:
            raise NotFoundError() from exc
        link = self._load_public_link(normalized)
        if link.password_hash and not check_password(password, link.password_hash):
            raise ShortLinkPasswordError()
        return self._validate_destination(link.destination_url)

    def find_by_ids(self, ids: Any) -> dict[str, ShortLink]:
        """Link còn tồn tại theo id (một query), dùng cho nút link rút gọn trong module khác.

        Args:
            ids: Id link.

        Returns:
            `{id dạng chuỗi: link}`.
        """
        return {str(item.pk): item for item in self.repository.filter(pk__in=list(ids))}

    def is_resolvable(self, link: ShortLink) -> bool:
        """Link đang hoạt động và chưa hết hạn.

        Args:
            link: Link.

        Returns:
            True nếu `/s/{slug}` sẽ mở trang trung gian.
        """
        return link.status == ShortLink.Status.ACTIVE and (
            link.expires_at is None or link.expires_at > timezone.now()
        )

    def _public_cache_key(self, normalized: str) -> str | None:
        """Khóa cache theo version namespace; None khi không có Redis."""
        version = self.cache_service.namespace_version(PUBLIC_CACHE_NAMESPACE)
        return None if version is None else f"{PUBLIC_CACHE_NAMESPACE}:{version}:short_link:{normalized}"

    def _store_public_cache(self, key: str, link: ShortLink) -> None:
        """Lưu các trường công khai; TTL không vượt quá lúc link hết hạn."""
        ttl = PUBLIC_CACHE_TTL_SECONDS
        if link.expires_at is not None:
            ttl = min(ttl, max(1, int((link.expires_at - timezone.now()).total_seconds())))
        has_password = bool(link.password_hash)
        self.cache_service.set_json(
            key,
            {
                "name": link.name,
                "description": link.description,
                "destination_url": None if has_password else link.destination_url,
                "has_password": has_password,
                "auto_redirect_seconds": link.auto_redirect_seconds,
                "expires_at": link.expires_at.timestamp() if link.expires_at else None,
            },
            ttl,
        )

    @staticmethod
    def _from_public_cache(data: dict[str, Any]) -> ShortLink:
        """Dựng link tạm (không lưu) từ cache; slug không có hoặc đã hết hạn thì báo lỗi như đọc DB."""
        if data.get("missing"):
            raise NotFoundError()
        expires_at = data.get("expires_at")
        if expires_at is not None and float(expires_at) <= timezone.now().timestamp():
            raise ShortLinkExpiredError()
        return ShortLink(
            name=data.get("name") or "",
            description=data.get("description") or "",
            destination_url=data.get("destination_url") or "",
            # Chỉ để serializer biết link có khóa; không phải mã băm thật và không bao giờ được lưu.
            password_hash=LOCKED_MARKER if data.get("has_password") else "",
            auto_redirect_seconds=data.get("auto_redirect_seconds"),
        )

    @staticmethod
    def _validate_expiration(value: Any) -> None:
        """Ngày hết hạn phải ở tương lai khi được nhập."""
        if value is not None and value <= timezone.now():
            raise ValidationError(details={"expires_at": ["Thời điểm hết hạn phải ở tương lai."]})

    @staticmethod
    def _validate_destination(value: str) -> str:
        """Chỉ HTTP/HTTPS; cấm trỏ vào `/s/` nội bộ để tránh chuỗi/vòng mở link."""
        url = validate_public_url(value)
        parts = urlsplit(url)
        if (
            parts.hostname
            and parts.hostname.lower() in settings.SHORT_LINK_INTERNAL_HOSTS
            and parts.path.startswith("/s/")
        ):
            raise ValidationError(details={"destination_url": ["Không thể trỏ đến Short Link nội bộ."]})
        return url
