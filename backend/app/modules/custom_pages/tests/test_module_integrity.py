"""Ràng buộc database và trạng thái module nội dung."""

from typing import Any

import pytest
from django.db import IntegrityError, transaction

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.permissions.custom_pages_permission import (
    CustomPagesPermission as PagePermission,
)
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_links_permission import (
    ShortLinksPermission as LinkPermission,
)
from app.modules.system.services.system_module_service import SystemModuleService

pytestmark = pytest.mark.django_db


class TestModuleIntegrity(BaseApiTestCase):
    """Module độc lập, quyền superuser và slug unique ở PostgreSQL."""

    def test_modules_can_be_disabled_independently(self, superuser: Any, login: Any) -> None:
        api = login(superuser)
        page = self.assert_success(
            api.post(
                "/api/v1/custom_pages/pages",
                {"title": "Page", "slug": "status-page", "status": "PUBLISHED"},
                format="json",
            ),
            201,
        )
        self.assert_success(
            api.post(
                "/api/v1/short_links/links",
                {"name": "Link", "slug": "status-link", "destination_url": "https://example.com"},
                format="json",
            ),
            201,
        )
        service = SystemModuleService()
        service.set_enabled(superuser, "short_links", False)
        self.assert_error(api.get("/api/v1/short_links/resolve/status-link"), 403, "MODULE_DISABLED")
        assert self.assert_success(api.get("/api/v1/custom_pages/public/status-page"), 200)["title"] == "Page"
        service.set_enabled(superuser, "custom_pages", False)
        self.assert_error(api.get("/api/v1/custom_pages/public/status-page"), 403, "MODULE_DISABLED")
        self.assert_error(
            api.patch(f"/api/v1/custom_pages/pages/{page['id']}", {"title": "Changed"}, format="json"),
            403,
            "MODULE_DISABLED",
        )
        assert Page.objects.get(pk=page["id"]).title == "Page"

    def test_slug_constraints_and_old_slug(self, user: Any, login: Any) -> None:
        grant(
            user, PagePermission.CREATE, PagePermission.UPDATE, LinkPermission.CREATE, LinkPermission.UPDATE
        )
        api = login(user)
        page = self.assert_success(
            api.post(
                "/api/v1/custom_pages/pages",
                {"title": "Page", "slug": "before", "status": "PUBLISHED"},
                format="json",
            ),
            201,
        )
        self.assert_success(
            api.patch(f"/api/v1/custom_pages/pages/{page['id']}", {"slug": "after"}, format="json"), 200
        )
        self.assert_error(api.get("/api/v1/custom_pages/public/before"), 404, "NOT_FOUND")
        with pytest.raises(IntegrityError), transaction.atomic():
            Page.objects.create(owner=user, title="Duplicate", slug="AFTER")
        link = self.assert_success(
            api.post(
                "/api/v1/short_links/links",
                {"name": "Link", "slug": "short-abc", "destination_url": "https://example.com"},
                format="json",
            ),
            201,
        )
        with pytest.raises(IntegrityError), transaction.atomic():
            ShortLink.objects.create(
                owner=user, name="Duplicate", slug="SHORT-ABC", destination_url="https://example.com"
            )
        self.assert_success(
            api.patch(f"/api/v1/short_links/links/{link['id']}", {"slug": "new-short"}, format="json"), 200
        )
        self.assert_error(api.get("/api/v1/short_links/resolve/short-abc"), 404, "NOT_FOUND")
