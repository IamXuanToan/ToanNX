"""Dọn dữ liệu hết hạn: lệnh `run_cleanup` và endpoint cron có bí mật."""

from datetime import timedelta
from io import StringIO
from typing import Any

import pytest
from django.core.management import call_command
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.rate_limit_bucket import RateLimitBucket
from app.modules.journal.models.journal_entry import JournalEntry

pytestmark = pytest.mark.django_db
URL = "/api/v1/health/cleanup"


class TestCleanup(BaseApiTestCase):
    """Task của module chạy qua một lệnh/endpoint chung."""

    def test_command_purges_expired_rows(self, settings: Any) -> None:
        now = timezone.now()
        RateLimitBucket.objects.create(
            key_hash="a" * 64, window_start=now, count=1, expires_at=now - timedelta(1)
        )
        old = JournalEntry.objects.create(resource="iam.role", object_id="x", action="CREATE")
        JournalEntry.objects.filter(pk=old.pk).update(created_at=now - timedelta(days=400))
        out = StringIO()
        call_command("run_cleanup", stdout=out)
        assert not RateLimitBucket.objects.filter(key_hash="a" * 64).exists()
        assert not JournalEntry.objects.filter(pk=old.pk).exists()
        assert "purge_journal" in out.getvalue()

    def test_endpoint_requires_secret(self, client: Any, settings: Any) -> None:
        settings.CRON_SECRET = ""
        self.assert_error(client.get(URL), 404, "NOT_FOUND")
        settings.CRON_SECRET = "s3cret"
        self.assert_error(client.get(URL, HTTP_AUTHORIZATION="Bearer wrong"), 404, "NOT_FOUND")
        data = self.assert_success(client.get(URL, HTTP_AUTHORIZATION="Bearer s3cret"))
        assert all(count >= 0 for count in data["results"].values())
