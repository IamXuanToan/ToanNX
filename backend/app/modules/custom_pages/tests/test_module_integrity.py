"""Ràng buộc database của module nội dung."""

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

pytestmark = pytest.mark.django_db


class TestModuleIntegrity(BaseApiTestCase):
    """Quyền superuser và slug unique ở PostgreSQL."""

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
