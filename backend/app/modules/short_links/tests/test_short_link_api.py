"""Integration tests cho quản lý và resolve Short Links."""

from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_links_permission import ShortLinksPermission as P

pytestmark = pytest.mark.django_db
BASE = "/api/v1/short_links/links"


class TestShortLinkApi(BaseApiTestCase):
    """CRUD có IAM, owner và redirect công khai."""

    @staticmethod
    def payload(slug: str = "my-link", **changes: Any) -> dict[str, Any]:
        """Payload hợp lệ dùng trong test."""
        return {"name": "My link", "slug": slug, "destination_url": "https://example.com/path", **changes}

    def test_create_list_and_redirect(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ)
        api = login(user)
        created = self.assert_success(api.post(BASE, self.payload(), format="json"), 201)
        assert created["slug"] == "my-link"
        assert created["owner_id"] == str(user.pk)
        assert created["short_url"] == "http://testserver/s/my-link"
        assert created["redirect_type"] == 302
        listed, pagination = self.assert_paginated(api.get(BASE))
        assert listed[0]["id"] == created["id"]
        assert pagination["total"] == 1
        redirect = api.get("/api/v1/short_links/resolve/my-link")
        assert redirect.status_code == 302
        assert redirect["Location"] == "https://example.com/path"

    def test_requires_login_and_permission(self, client: Any, user: Any, login: Any) -> None:
        self.assert_unauthorized(client.post(BASE, self.payload(), format="json"))
        self.assert_forbidden(login(user).post(BASE, self.payload(), format="json"))

    def test_invalid_duplicate_and_loop(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE)
        api = login(user)
        self.assert_success(api.post(BASE, self.payload(), format="json"), 201)
        self.assert_error(api.post(BASE, self.payload(slug="MY-LINK"), format="json"), 409, "CONFLICT")
        self.assert_error(
            api.post(BASE, self.payload(slug="bad/link"), format="json"), 400, "VALIDATION_ERROR"
        )
        self.assert_error(
            api.post(
                BASE, self.payload(slug="bad-protocol", destination_url="javascript:alert(1)"), format="json"
            ),
            400,
            "VALIDATION_ERROR",
        )
        self.assert_error(
            api.post(
                BASE, self.payload(slug="loop", destination_url="https://toannx.com/s/loop"), format="json"
            ),
            400,
            "VALIDATION_ERROR",
        )

    def test_owner_and_manage_all(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ, P.UPDATE, P.DELETE)
        owner_api = login(user)
        item = self.assert_success(owner_api.post(BASE, self.payload(), format="json"), 201)
        other = UserFactory()
        grant(other, P.READ, P.UPDATE, P.DELETE)
        other_api = login(other)
        self.assert_error(other_api.get(f"{BASE}/{item['id']}"), 404, "NOT_FOUND")
        self.assert_error(
            other_api.patch(f"{BASE}/{item['id']}", {"name": "Hijack"}, format="json"), 404, "NOT_FOUND"
        )
        self.assert_error(other_api.delete(f"{BASE}/{item['id']}"), 404, "NOT_FOUND")
        assert self.assert_paginated(other_api.get(BASE))[1]["total"] == 0
        grant(other, P.MANAGE_ALL)
        other_api = login(other)
        assert self.assert_paginated(other_api.get(BASE))[1]["total"] == 1
        self.assert_success(other_api.patch(f"{BASE}/{item['id']}", {"name": "Managed"}, format="json"), 200)

    def test_301_inactive_expired_and_delete(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.UPDATE, P.DELETE)
        api = login(user)
        item = self.assert_success(api.post(BASE, self.payload(redirect_type=301), format="json"), 201)
        assert item["redirect_warning"]
        assert api.get("/api/v1/short_links/resolve/my-link").status_code == 301
        self.assert_success(api.patch(f"{BASE}/{item['id']}", {"status": "INACTIVE"}, format="json"), 200)
        self.assert_error(api.get("/api/v1/short_links/resolve/my-link"), 404, "NOT_FOUND")
        self.assert_success(api.patch(f"{BASE}/{item['id']}", {"status": "ACTIVE"}, format="json"), 200)
        ShortLink.objects.filter(pk=item["id"]).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assert_error(api.get("/api/v1/short_links/resolve/my-link"), 410, "SHORT_LINK_EXPIRED")
        assert api.delete(f"{BASE}/{item['id']}").status_code == 204
        self.assert_error(api.get("/api/v1/short_links/resolve/my-link"), 404, "NOT_FOUND")

    def test_create_rate_limit(self, user: Any, login: Any, settings: Any) -> None:
        """Dùng rate limiter PostgreSQL sẵn có cho việc tạo link."""
        settings.SHORT_LINK_CREATE_RATE_LIMIT = 1
        grant(user, P.CREATE)
        api = login(user)
        self.assert_success(api.post(BASE, self.payload(slug="one-link"), format="json"), 201)
        self.assert_error(api.post(BASE, self.payload(slug="two-link"), format="json"), 429, "RATE_LIMITED")
