"""Kiểm thử `AttachmentService.get_current_storage_usage_bytes`: tổng gồm cả bucket công khai và riêng tư."""

from typing import Any, cast

from app.core.storage.r2_usage_service import R2UsageService
from app.system.repositories.attachment_repository import AttachmentRepository
from app.system.services.attachment_service import AttachmentService

PUBLIC_BUCKET = "toannx-media"
PRIVATE_BUCKET = "toannx-private"
DB_PUBLIC = 300
DB_PRIVATE = 70


class _Usage:
    """Giả R2UsageService: số bytes cố định (None = chưa cấu hình / API lỗi)."""

    def __init__(self, bucket_name: str, used: int | None) -> None:
        self.bucket_name = bucket_name
        self.used = used

    def is_configured(self) -> bool:
        return bool(self.bucket_name) and self.used is not None

    def get_bucket_usage_bytes(self) -> int | None:
        return self.used


class _Repository:
    """Giả repository: tổng dung lượng file chưa dọn theo chế độ xem (None = cả hai)."""

    def get_total_storage_size(self, visibility: str | None = None) -> int:
        if visibility == "private":
            return DB_PRIVATE
        if visibility == "public":
            return DB_PUBLIC
        return DB_PUBLIC + DB_PRIVATE


def _service(public: _Usage, private: _Usage) -> AttachmentService:
    return AttachmentService(
        repository=cast(AttachmentRepository, _Repository()),
        r2_usage_service=cast(R2UsageService, public),
        private_r2_usage_service=cast(R2UsageService, private),
        folder_service=cast(Any, object()),
        storage_service=cast(Any, object()),
        notification_service=cast(Any, object()),
    )


def test_sums_both_buckets_from_r2_api() -> None:
    """Đo được cả hai bucket: cộng hai số của API."""
    service = _service(_Usage(PUBLIC_BUCKET, 1_000), _Usage(PRIVATE_BUCKET, 250))
    assert service.get_current_storage_usage_bytes() == 1_250


def test_private_bucket_unavailable_falls_back_to_db_private_total() -> None:
    """Bucket riêng tư chưa cấu hình / API lỗi: số API công khai + tổng file riêng tư trong DB."""
    service = _service(_Usage(PUBLIC_BUCKET, 1_000), _Usage("", None))
    assert service.get_current_storage_usage_bytes() == 1_000 + DB_PRIVATE


def test_public_bucket_unavailable_uses_db_total_of_both() -> None:
    """Không đo được bucket công khai: tổng DB của cả hai chế độ."""
    service = _service(_Usage(PUBLIC_BUCKET, None), _Usage(PRIVATE_BUCKET, 250))
    assert service.get_current_storage_usage_bytes() == DB_PUBLIC + DB_PRIVATE


def test_same_bucket_for_both_is_not_counted_twice() -> None:
    """Cấu hình nhầm hai kho cùng một bucket: chỉ lấy số của API một lần."""
    service = _service(_Usage(PUBLIC_BUCKET, 1_000), _Usage(PUBLIC_BUCKET, 1_000))
    assert service.get_current_storage_usage_bytes() == 1_000
