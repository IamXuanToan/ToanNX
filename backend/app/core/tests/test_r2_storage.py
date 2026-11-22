"""Kiểm thử cấu hình và hành vi của Cloudflare R2 Storage adapter."""

from django.test import SimpleTestCase, override_settings

from app.core.storage.r2_private_storage import R2PrivateStorage
from app.core.storage.r2_storage import PRIVATE_CACHE_CONTROL, PUBLIC_CACHE_CONTROL, R2Storage


class TestR2Storage(SimpleTestCase):
    """Kiểm tra R2Storage kế thừa S3Storage và áp dụng đúng cấu hình Cloudflare R2."""

    @override_settings(
        CLOUDFLARE_R2_ACCOUNT_ID="test_account_123",
        CLOUDFLARE_R2_ACCESS_KEY_ID="test_access_key",
        CLOUDFLARE_R2_SECRET_ACCESS_KEY="test_secret_key",
        CLOUDFLARE_R2_BUCKET_NAME="toannx-media",
        CLOUDFLARE_R2_CUSTOM_DOMAIN="media.toannx.com",
        CLOUDFLARE_R2_ENDPOINT_URL="",
    )
    def test_r2_storage_configuration(self) -> None:
        """Đảm bảo các thuộc tính và endpoint URL khớp chuẩn Cloudflare R2."""
        storage = R2Storage()

        assert storage.default_acl is None
        assert storage.signature_version == "s3v4"
        assert storage.querystring_auth is False
        assert storage.file_overwrite is False
        assert storage.region_name == "auto"
        assert storage.endpoint_url == "https://test_account_123.r2.cloudflarestorage.com"
        assert storage.custom_domain == "media.toannx.com"

    @override_settings(
        CLOUDFLARE_R2_BUCKET_NAME="toannx-media",
        CLOUDFLARE_R2_CUSTOM_DOMAIN="https://media.toannx.com/",
        CLOUDFLARE_R2_ACCESS_KEY_ID="key",
        CLOUDFLARE_R2_SECRET_ACCESS_KEY="secret",
    )
    def test_r2_storage_url_generation(self) -> None:
        """Đảm bảo URL sinh ra có domain CDN tùy chỉnh và không bị thừa slash/protocol."""
        storage = R2Storage()
        assert storage.custom_domain == "media.toannx.com"

        url = storage.url("attachments/2026/11/abcxyz.jpg")
        assert url == "https://media.toannx.com/attachments/2026/11/abcxyz.jpg"

    @override_settings(
        CLOUDFLARE_R2_BUCKET_NAME="public-bucket",
        CLOUDFLARE_R2_PRIVATE_BUCKET_NAME="private-bucket",
        CLOUDFLARE_R2_ACCESS_KEY_ID="key",
        CLOUDFLARE_R2_SECRET_ACCESS_KEY="secret",
        ATTACHMENT_PRIVATE_URL_TTL_SECONDS=300,
    )
    def test_cache_control_public_immutable_private_no_store(self) -> None:
        """File công khai cache 1 năm (khóa UUID mới mỗi lần thay); file riêng tư không cache."""
        public = R2Storage()
        private = R2PrivateStorage()
        assert public.get_object_parameters("a.png")["CacheControl"] == PUBLIC_CACHE_CONTROL
        assert "immutable" in PUBLIC_CACHE_CONTROL
        assert private.get_object_parameters("a.pdf")["CacheControl"] == PRIVATE_CACHE_CONTROL
