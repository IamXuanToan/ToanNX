"""Kiểm thử `AttachmentService.get_current_storage_usage_bytes`: tổng gồm cả bucket công khai và riêng tư."""

import time
from datetime import timedelta
from typing import Any, cast

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from app.core.storage.r2_usage_service import R2UsageService
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.constants.storage_cache import (
    STORAGE_USAGE_CACHE_KEY,
    STORAGE_USAGE_CACHE_TTL_SECONDS,
)
from app.system.models.attachment import Attachment
from app.system.repositories.attachment_repository import AttachmentRepository
from app.system.services.attachment_purge_service import AttachmentPurgeService
from app.system.services.attachment_service import AttachmentService
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.test_attachment_create_api import PNG_BYTES

PUBLIC_BUCKET = "toannx-media"
PRIVATE_BUCKET = "toannx-private"
DB_PUBLIC = 300
DB_PRIVATE = 70


class _Usage:
    """Giả R2UsageService: số bytes cố định (None = chưa cấu hình / API lỗi)."""

    def __init__(self, bucket_name: str, used: int | None) -> None:
        self.bucket_name = bucket_name
        self.used = used
        self.calls = 0

    def is_configured(self) -> bool:
        return bool(self.bucket_name) and self.used is not None

    def get_bucket_usage_bytes(self) -> int | None:
        self.calls += 1
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


def test_r2_usage_caches_display_reads_for_300s(fake_redis: FakeRedis) -> None:
    """Đọc thống kê (`use_cache=True`) lưu Redis TTL 300s và chỉ gọi R2 API một lần."""
    public = _Usage(PUBLIC_BUCKET, 1_000)
    private = _Usage(PRIVATE_BUCKET, 250)
    service = _service(public, private)

    assert service.get_current_storage_usage_bytes() == 1_250
    assert public.calls == 1 and private.calls == 1
    ttl = fake_redis.expires[STORAGE_USAGE_CACHE_KEY] - time.monotonic()
    assert STORAGE_USAGE_CACHE_TTL_SECONDS - 10 <= ttl <= STORAGE_USAGE_CACHE_TTL_SECONDS + 1

    # Lần đọc thứ 2 trong vòng 300s lấy từ Redis -> R2 API vẫn chỉ gọi 1 lần
    assert service.get_current_storage_usage_bytes() == 1_250
    assert public.calls == 1 and private.calls == 1

    # Đo tươi (`use_cache=False`) bắt buộc gọi lại R2 API để kiểm quota chính xác
    public.used = 2_000
    assert service.get_current_storage_usage_bytes(use_cache=False) == 2_250
    assert public.calls == 2

    # Khi Redis lỗi vẫn fallback gọi trực tiếp R2 API thay vì crash
    fake_redis.fail = True
    assert service.get_current_storage_usage_bytes() == 2_250
    assert public.calls == 3 and private.calls == 3
    fake_redis.fail = False


@pytest.mark.django_db
def test_upload_quota_ignores_stale_cache_and_mutations_invalidate(
    fake_redis: FakeRedis,
    settings: Any,
    django_capture_on_commit_callbacks: Any,
) -> None:
    """Upload thật bỏ qua cache cũ (không cho vượt quota) và tự xóa cache sau upload/xóa/visibility/purge."""
    user = UserFactory()
    fake_redis.set(STORAGE_USAGE_CACHE_KEY, "100", ex=300)
    settings.ATTACHMENT_MAX_TOTAL_STORAGE_BYTES = 1000

    stale_usage = _Usage(PUBLIC_BUCKET, 1200)
    service = AttachmentService(
        r2_usage_service=cast(R2UsageService, stale_usage),
        private_r2_usage_service=cast(R2UsageService, _Usage(PRIVATE_BUCKET, 0)),
    )

    from app.core.exceptions.validation_error import ValidationError

    # Dù Redis đang cache 100 bytes, upload thật đo tươi thấy R2=1200 -> chặn ngay!
    with pytest.raises(ValidationError) as exc_info:
        service.create(user, {"file": SimpleUploadedFile("over.png", PNG_BYTES, content_type="image/png")})
    assert exc_info.value.code == "ATTACHMENT_STORAGE_QUOTA_EXCEEDED"

    # Khi R2 nằm trong quota: upload, đổi visibility, delete và purge đều xóa cache
    ok_service = AttachmentService(
        r2_usage_service=cast(R2UsageService, _Usage(PUBLIC_BUCKET, 100)),
        private_r2_usage_service=cast(R2UsageService, _Usage(PRIVATE_BUCKET, 0)),
    )
    with django_capture_on_commit_callbacks(execute=True):
        att = ok_service.create(
            user, {"file": SimpleUploadedFile("ok.png", PNG_BYTES, content_type="image/png")}
        )
    assert STORAGE_USAGE_CACHE_KEY not in fake_redis.data

    fake_redis.set(STORAGE_USAGE_CACHE_KEY, "999", ex=300)
    with django_capture_on_commit_callbacks(execute=True):
        ok_service.set_visibility(user, att.pk, Attachment.Visibility.PRIVATE)
    assert STORAGE_USAGE_CACHE_KEY not in fake_redis.data

    fake_redis.set(STORAGE_USAGE_CACHE_KEY, "999", ex=300)
    with django_capture_on_commit_callbacks(execute=True):
        ok_service.delete(user, att.pk)
    assert STORAGE_USAGE_CACHE_KEY not in fake_redis.data

    # Purge file xóa mềm quá hạn
    att2 = Attachment.objects.create(
        created_by=user,
        file="attachments/purge-test.png",
        visibility=Attachment.Visibility.PUBLIC,
        original_name="purge.png",
        content_type="image/png",
        size=len(PNG_BYTES),
        deleted_at=timezone.now() - timedelta(days=30),
        purged_at=None,
    )
    fake_redis.set(STORAGE_USAGE_CACHE_KEY, "999", ex=300)
    assert AttachmentPurgeService().purge() >= 1
    assert STORAGE_USAGE_CACHE_KEY not in fake_redis.data
    att2.refresh_from_db()
    assert att2.purged_at is not None
