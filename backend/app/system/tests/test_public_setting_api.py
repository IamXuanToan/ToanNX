"""Kiểm thử endpoint cấu hình công khai: GET /api/v1/system/settings/public."""

import time
from typing import Any

import pytest
from django.db import transaction

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.constants.setting_cache import (
    PUBLIC_SETTING_CACHE_NAMESPACE,
    PUBLIC_SETTING_CACHE_TTL_SECONDS,
)
from app.system.models.setting import Setting
from app.system.services.setting_service import SettingService

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/settings/public"


class TestPublicSettingApi(BaseApiTestCase):
    """Kiểm thử GET /api/v1/system/settings/public."""

    def test_get_public_settings_unauthenticated_allowed(self, client: Any) -> None:
        """Khách chưa đăng nhập vẫn đọc được cấu hình công khai (200)."""
        res = client.get(URL)
        data = self.assert_success(res, 200)
        assert "auth_google_enabled" in data
        assert "auth_github_enabled" in data
        assert data["auth_google_enabled"] is True
        assert data["auth_github_enabled"] is True

    def test_public_settings_redis_cache_hit_miss_and_invalidation(
        self,
        client: Any,
        superuser: Any,
        login: Any,
        fake_redis: FakeRedis,
        django_assert_num_queries: Any,
        django_capture_on_commit_callbacks: Any,
    ) -> None:
        """Cache hit dùng 0 DB query; chỉ lưu key is_public=True; invalidate on_commit khi Setting đổi."""
        Setting.objects.create(
            key="private_secret_cfg", value="secret-val", is_public=False, category="system"
        )
        # Miss đầu tiên: query DB và ghi cache TTL 600s
        res1 = client.get(URL)
        data1 = self.assert_success(res1, 200)
        assert "private_secret_cfg" not in data1
        cache_key = next(
            k
            for k in fake_redis.expires
            if k.startswith(f"{PUBLIC_SETTING_CACHE_NAMESPACE}:") and k.endswith(":all")
        )
        ttl = fake_redis.expires[cache_key] - time.monotonic()
        assert PUBLIC_SETTING_CACHE_TTL_SECONDS - 10 <= ttl <= PUBLIC_SETTING_CACHE_TTL_SECONDS + 1

        # Hit lần 2: 0 DB query!
        with django_assert_num_queries(0):
            res2 = client.get(URL)
        assert self.assert_success(res2, 200) == data1

        # Rollback KHÔNG làm mất hoặc sai cache
        with pytest.raises(RuntimeError), transaction.atomic():
            SettingService().set_setting_value("auth_google_enabled", False, is_public=True)
            raise RuntimeError("rollback")
        with django_assert_num_queries(0):
            assert self.assert_success(client.get(URL), 200)["auth_google_enabled"] is True

        # Cập nhật qua API PATCH /system/settings/{id} -> commit invalidate cache
        setting = Setting.objects.get(key="auth_google_enabled")
        with django_capture_on_commit_callbacks(execute=True):
            patch_res = login(superuser).patch(
                f"/api/v1/system/settings/{setting.pk}", {"value": False}, format="json"
            )
        self.assert_success(patch_res, 200)
        assert self.assert_success(client.get(URL), 200)["auth_google_enabled"] is False

        # Đổi lại qua set_setting_value -> on_commit invalidate cache
        with django_capture_on_commit_callbacks(execute=True):
            SettingService().set_setting_value("auth_google_enabled", True, is_public=True)
        assert self.assert_success(client.get(URL), 200)["auth_google_enabled"] is True

    def test_public_settings_falls_back_to_db_when_redis_errors(
        self, client: Any, fake_redis: FakeRedis
    ) -> None:
        """Khi Redis lỗi kết nối/timeout, vẫn fallback về DB bình thường (200)."""
        fake_redis.fail = True
        res = client.get(URL)
        data = self.assert_success(res, 200)
        assert data["auth_google_enabled"] is True
