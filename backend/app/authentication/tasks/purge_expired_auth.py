"""Task dọn dữ liệu của module Authentication (chạy bởi `manage.py run_cleanup`)."""

from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from app.authentication.repositories.auth_session_repository import AuthSessionRepository
from app.authentication.repositories.rate_limit_bucket_repository import RateLimitBucketRepository


@transaction.atomic
def purge_expired_auth() -> int:
    """Xóa bucket rate limit hết hạn và phiên hết hạn/thu hồi quá `AUTH_EXPIRED_RETENTION_DAYS`.

    Returns:
        Tổng số bản ghi đã xóa.
    """
    now = timezone.now()
    buckets = RateLimitBucketRepository().delete_expired(now)
    moment = now - timedelta(days=settings.AUTH_EXPIRED_RETENTION_DAYS)
    return buckets + AuthSessionRepository().delete_expired_before(moment)
