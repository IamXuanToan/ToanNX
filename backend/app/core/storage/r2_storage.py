"""Storage backend cho Cloudflare R2 Object Storage (chuẩn S3 API, Zero Egress)."""

from typing import Any

from django.conf import settings
from storages.backends.s3 import S3Storage


class R2Storage(S3Storage):
    """Storage adapter chuyên dụng cho Cloudflare R2.

    Kế thừa `S3Storage` và áp dụng các cấu hình tối ưu của Cloudflare R2:
    - Signature Version: s3v4
    - Default ACL: None (Cloudflare R2 không dùng ACLs như AWS S3)
    - Querystring Auth: False (URL public tĩnh dạng https://<custom_domain>/<path>)
    - File Overwrite: False (không ghi đè file trùng tên)
    - Addressing Style: path
    - Region Name: auto
    """

    default_acl = None
    signature_version = "s3v4"
    querystring_auth = False
    file_overwrite = False
    region_name = "auto"
    addressing_style = "path"

    def __init__(self, **settings_dict: Any) -> None:
        """Khởi tạo cấu hình R2 từ settings của Django."""
        account_id = getattr(settings, "CLOUDFLARE_R2_ACCOUNT_ID", "")
        endpoint_url = getattr(settings, "CLOUDFLARE_R2_ENDPOINT_URL", "")
        if not endpoint_url and account_id:
            endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

        settings_dict.setdefault("access_key", getattr(settings, "CLOUDFLARE_R2_ACCESS_KEY_ID", ""))
        settings_dict.setdefault("secret_key", getattr(settings, "CLOUDFLARE_R2_SECRET_ACCESS_KEY", ""))
        settings_dict.setdefault("bucket_name", getattr(settings, "CLOUDFLARE_R2_BUCKET_NAME", ""))
        settings_dict.setdefault("endpoint_url", endpoint_url)

        custom_domain = getattr(settings, "CLOUDFLARE_R2_CUSTOM_DOMAIN", "")
        if custom_domain:
            cleaned_domain = custom_domain.replace("https://", "").replace("http://", "").rstrip("/")
            settings_dict.setdefault("custom_domain", cleaned_domain)

        super().__init__(**settings_dict)
