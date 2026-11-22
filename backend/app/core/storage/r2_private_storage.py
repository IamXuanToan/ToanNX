"""Storage R2 cho file riêng tư: bucket không bật public access, chỉ mở bằng link ký hạn ngắn."""

from typing import Any

from django.conf import settings

from app.core.storage.r2_storage import PRIVATE_CACHE_CONTROL, R2Storage


class R2PrivateStorage(R2Storage):
    """Bucket `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME`.

    - Không dùng custom domain (custom domain của R2 luôn công khai).
    - `url()` trả presigned URL (`querystring_auth`) hạn `ATTACHMENT_PRIVATE_URL_TTL_SECONDS`.
    """

    querystring_auth = True

    def __init__(self, **settings_dict: Any) -> None:
        """Khởi tạo như R2Storage nhưng trỏ bucket riêng tư và bỏ custom domain."""
        settings_dict.setdefault("bucket_name", settings.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME)
        # File riêng tư không được cache ở trình duyệt/CDN (link ký hết hạn sau vài phút).
        settings_dict.setdefault("object_parameters", {"CacheControl": PRIVATE_CACHE_CONTROL})
        settings_dict.setdefault("querystring_expire", settings.ATTACHMENT_PRIVATE_URL_TTL_SECONDS)
        settings_dict["custom_domain"] = None
        super().__init__(**settings_dict)
