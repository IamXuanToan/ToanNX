"""Kiểm thử hồi quy bảo mật & đồng bộ quyền IAM sau đợt rà soát toàn hệ thống."""

from __future__ import annotations

import logging
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.novel.serializers.validates.novel_import_validate_serializer import (
    MAX_IMPORT_CHAPTERS,
    NovelImportValidateSerializer,
)
from app.system.models.permission import Permission
from app.system.models.role import Role
from app.system.models.role_permission import RolePermission
from app.system.models.user import User
from app.system.permissions.user_permission import UserPermission as A
from app.system.services.github_oauth_service import GitHubOAuthService
from app.system.services.google_oauth_service import GoogleOAuthService
from app.system.services.iam_sync_service import IamSyncService

pytestmark = pytest.mark.django_db


class TestSecurityAndIamHardening(BaseApiTestCase):
    """Kiểm thử hồi quy cho các chốt an toàn đã rà soát và gia cố."""

    def test_iam_sync_removes_deactivated_permissions_from_auto_grant_roles(self) -> None:
        """IamSyncService.sync() gỡ bỏ quyền cũ bị vô hiệu khỏi vai trò auto_grant."""
        stale = Permission.objects.create(
            code="workspace.monitor_target.read",
            module="workspace",
            resource="monitor_target",
            action="read",
            name="Monitor Target",
            is_active=True,
        )
        admin_role = Role.objects.get(code="ADMIN")
        RolePermission.objects.get_or_create(role=admin_role, permission=stale)

        IamSyncService().sync()

        stale.refresh_from_db()
        assert stale.is_active is False
        assert not RolePermission.objects.filter(role=admin_role, permission=stale).exists()

    def test_client_error_view_strips_crlf_for_log_injection_defense(self, client: Any, caplog: Any) -> None:
        """Endpoint báo lỗi FE loại bỏ xuống dòng trên url/message để chống giả mạo log."""
        with caplog.at_level(logging.ERROR, logger="app.client"):
            res = client.post(
                "/api/v1/system/health/client-errors",
                {
                    "url": "/vi/login\nFAKE HEADER",
                    "message": "Boom\r\nFAKE LINE",
                    "digest": "d1\nFAKE",
                },
                format="json",
            )
        assert res.status_code == 204
        assert len(caplog.records) == 1
        assert "FAKE HEADER\n" not in caplog.records[0].getMessage()
        assert "\r" not in caplog.records[0].getMessage()

    def test_oauth_requests_enforce_max_5s_timeout(self, settings: Any) -> None:
        """Các lời gọi HTTPS tới Google/GitHub OAuth phải có timeout <= 5 giây."""
        settings.GOOGLE_OAUTH_CLIENT_ID = "gid"
        settings.GOOGLE_OAUTH_CLIENT_SECRET = "gsec"
        settings.GITHUB_OAUTH_CLIENT_ID = "ghid"
        settings.GITHUB_OAUTH_CLIENT_SECRET = "ghsec"

        ok_google_token = MagicMock(status_code=200)
        ok_google_token.json.return_value = {"access_token": "tok"}
        ok_google_user = MagicMock(status_code=200)
        ok_google_user.json.return_value = {"sub": "1", "email": "a@example.com"}

        with (
            patch(
                "app.system.services.google_oauth_service.requests.post", return_value=ok_google_token
            ) as g_post,
            patch(
                "app.system.services.google_oauth_service.requests.get", return_value=ok_google_user
            ) as g_get,
        ):
            GoogleOAuthService().get_user_info("code", "http://localhost:3001/auth/callback/google")
        assert g_post.call_args.kwargs["timeout"] <= 5
        assert g_get.call_args.kwargs["timeout"] <= 5

        ok_gh_token = MagicMock(status_code=200)
        ok_gh_token.json.return_value = {"access_token": "tok"}
        ok_gh_user = MagicMock(status_code=200)
        ok_gh_user.json.return_value = {"id": 99, "email": "b@example.com", "login": "b"}

        with (
            patch(
                "app.system.services.github_oauth_service.requests.post", return_value=ok_gh_token
            ) as gh_post,
            patch("app.system.services.github_oauth_service.requests.get", return_value=ok_gh_user) as gh_get,
        ):
            GitHubOAuthService().get_user_info("code", "http://localhost:3001/auth/callback/github")
        assert gh_post.call_args.kwargs["timeout"] <= 5
        assert gh_get.call_args.kwargs["timeout"] <= 5

    def test_novel_import_rejects_excessive_chapter_count(self) -> None:
        """NovelImportValidateSerializer chặn danh sách chương vượt ngưỡng để tránh nghẽn DB."""
        payload = {
            "novel": {"title": "Test"},
            "chapters": [{"title": f"C{i}", "content": "abc"} for i in range(MAX_IMPORT_CHAPTERS + 1)],
        }
        ser = NovelImportValidateSerializer(data=payload)
        assert ser.is_valid() is False
        assert "chapters" in ser.errors

    def test_non_superuser_cannot_bulk_lock_or_delete_superuser(
        self, staff_with: Any, superuser: User, login: Any
    ) -> None:
        """Nhân viên không phải superuser không thể khóa/xóa superuser qua bulk endpoints."""
        actor = staff_with(A.USER_UPDATE.code, A.USER_DELETE.code)
        api = login(actor)

        res_upd = api.post(
            "/api/v1/system/users/bulk-update",
            {"ids": [str(superuser.pk)], "is_active": False},
            format="json",
        )
        self.assert_error(res_upd, 403, "ACCOUNT_SUPERUSER_PROTECTED")

        res_del = api.post(
            "/api/v1/system/users/bulk-delete",
            {"ids": [str(superuser.pk)]},
            format="json",
        )
        self.assert_error(res_del, 403, "ACCOUNT_SUPERUSER_PROTECTED")
