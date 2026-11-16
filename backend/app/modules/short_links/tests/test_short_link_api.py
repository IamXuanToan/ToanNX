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
    """CRUD có IAM, owner và trang trung gian công khai."""

    @staticmethod
    def payload(slug: str = "my-link", **changes: Any) -> dict[str, Any]:
        """Payload hợp lệ dùng trong test."""
        return {"name": "My link", "slug": slug, "destination_url": "https://example.com/path", **changes}

    def test_create_list_and_landing(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ)
        api = login(user)
        created = self.assert_success(api.post(BASE, self.payload(), format="json"), 201)
        assert created["slug"] == "my-link"
        assert created["owner_id"] == str(user.pk)
        assert created["short_url"] == "http://testserver/s/my-link"
        assert created["auto_redirect_seconds"] is None
        assert created["has_password"] is False
        listed, pagination = self.assert_paginated(api.get(BASE, {"page": 1}))
        assert listed[0]["id"] == created["id"]
        assert pagination["total"] == 1
        landing = api.get("/api/v1/short_links/resolve/my-link")
        assert self.assert_success(landing)["destination_url"] == "https://example.com/path"
        assert landing.status_code == 200
        assert "Location" not in landing

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
        assert self.assert_paginated(other_api.get(BASE, {"page": 1}))[1]["total"] == 0
        grant(other, P.MANAGE_ALL)
        other_api = login(other)
        assert self.assert_paginated(other_api.get(BASE, {"page": 1}))[1]["total"] == 1
        managed = self.assert_success(
            other_api.patch(
                f"{BASE}/{item['id']}", {"name": "Managed", "password": "admin-pass"}, format="json"
            ),
            200,
        )
        assert managed["has_password"] is True
        assert (
            self.assert_success(
                other_api.post(
                    "/api/v1/short_links/resolve/my-link", {"password": "admin-pass"}, format="json"
                )
            )["destination_url"]
            == "https://example.com/path"
        )

    def test_auto_redirect_inactive_expired_and_delete(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.UPDATE, P.DELETE)
        api = login(user)
        item = self.assert_success(api.post(BASE, self.payload(auto_redirect_seconds=5), format="json"), 201)
        assert item["auto_redirect_seconds"] == 5
        assert (
            self.assert_success(api.get("/api/v1/short_links/resolve/my-link"))["auto_redirect_seconds"] == 5
        )
        self.assert_success(api.patch(f"{BASE}/{item['id']}", {"status": "INACTIVE"}, format="json"), 200)
        self.assert_error(api.get("/api/v1/short_links/resolve/my-link"), 404, "NOT_FOUND")
        self.assert_success(api.patch(f"{BASE}/{item['id']}", {"status": "ACTIVE"}, format="json"), 200)
        ShortLink.objects.filter(pk=item["id"]).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assert_error(api.get("/api/v1/short_links/resolve/my-link"), 410, "SHORT_LINK_EXPIRED")
        assert (
            self.assert_success(api.patch(f"{BASE}/{item['id']}", {"password": "late-pass"}, format="json"))[
                "has_password"
            ]
            is True
        )
        assert api.delete(f"{BASE}/{item['id']}").status_code == 204
        self.assert_error(api.get("/api/v1/short_links/resolve/my-link"), 404, "NOT_FOUND")

    def test_create_rate_limit(self, user: Any, login: Any, settings: Any) -> None:
        """Dùng rate limiter PostgreSQL sẵn có cho việc tạo link."""
        settings.RATE_LIMITS = {**settings.RATE_LIMITS, "short_links.create": (1, 3600, "user")}
        grant(user, P.CREATE)
        api = login(user)
        self.assert_success(api.post(BASE, self.payload(slug="one-link"), format="json"), 201)
        self.assert_error(api.post(BASE, self.payload(slug="two-link"), format="json"), 429, "RATE_LIMITED")

    def test_bulk_filters_and_history(self, user: Any, login: Any) -> None:
        """Bulk tất cả-hoặc-không, lọc nhiều giá trị (EXPIRED suy từ expires_at), lịch sử thay đổi."""
        grant(user, P.CREATE, P.READ, P.UPDATE, P.DELETE)
        api = login(user)
        first = self.assert_success(api.post(BASE, self.payload(slug="bulk-one"), format="json"), 201)
        second = self.assert_success(api.post(BASE, self.payload(slug="bulk-two"), format="json"), 201)
        ShortLink.objects.filter(pk=second["id"]).update(expires_at=timezone.now() - timedelta(minutes=1))

        assert self.assert_success(
            api.post(f"{BASE}/bulk-update", {"ids": [first["id"]], "status": "INACTIVE"}, format="json")
        ) == {"count": 1}
        items = self.assert_success(api.get(BASE, {"status": "INACTIVE"}))
        assert [item["id"] for item in items] == [first["id"]]
        items = self.assert_success(api.get(BASE, {"status": "EXPIRED,INACTIVE"}))
        assert {item["id"] for item in items} == {first["id"], second["id"]}
        assert items[0]["owner"]["email"] == user.email
        self.assert_error(api.get(BASE, {"status": "NOPE"}), 400, "VALIDATION_ERROR")

        history = self.assert_success(api.get(f"{BASE}/{first['id']}/history"))
        assert [entry["action"] for entry in history] == ["UPDATE", "CREATE"]
        assert history[0]["changes"] == {"status": ["ACTIVE", "INACTIVE"]}

        assert self.assert_success(
            api.post(f"{BASE}/bulk-delete", {"ids": [first["id"], second["id"]]}, format="json")
        ) == {"count": 2}
        assert self.assert_success(api.get(BASE)) == []

    def test_resolve_headers_and_bad_slug(self, user: Any, login: Any, client: Any) -> None:
        grant(user, P.CREATE)
        login(user).post(BASE, self.payload(slug="head-link"), format="json")
        response = client.get("/api/v1/short_links/resolve/head-link")
        assert response.status_code == 200
        assert response["Cache-Control"] == "no-store"
        assert response["X-Robots-Tag"] == "noindex"
        self.assert_error(client.get("/api/v1/short_links/resolve/A_B"), 404, "NOT_FOUND")

    def test_password_is_hashed_and_public_destination_is_hidden(
        self, user: Any, login: Any, client: Any
    ) -> None:
        """Mật khẩu không lộ ở API; sai mật khẩu không tiết lộ đích."""
        grant(user, P.CREATE, P.READ, P.UPDATE)
        api = login(user)
        item = self.assert_success(api.post(BASE, self.payload(password="simple pass"), format="json"), 201)
        assert item["has_password"] is True
        assert "password" not in item and "password_hash" not in item
        stored = ShortLink.objects.get(pk=item["id"])
        assert stored.password_hash != "simple pass"
        public = self.assert_success(client.get("/api/v1/short_links/resolve/my-link"))
        assert public["destination_url"] is None
        assert public["has_password"] is True
        unlock = "/api/v1/short_links/resolve/my-link"
        self.assert_error(
            client.post(unlock, {"password": "wrong"}, format="json"), 403, "SHORT_LINK_INVALID_PASSWORD"
        )
        assert self.assert_success(client.post(unlock, {"password": "simple pass"}, format="json")) == {
            "destination_url": "https://example.com/path"
        }
        updated = self.assert_success(api.patch(f"{BASE}/{item['id']}", {"password": "new"}, format="json"))
        assert updated["has_password"] is True
        self.assert_error(
            client.post(unlock, {"password": "simple pass"}, format="json"),
            403,
            "SHORT_LINK_INVALID_PASSWORD",
        )
        assert self.assert_success(client.post(unlock, {"password": "new"}, format="json"))["destination_url"]
        assert (
            self.assert_success(api.patch(f"{BASE}/{item['id']}", {"password": ""}, format="json"))[
                "has_password"
            ]
            is False
        )
        assert self.assert_success(client.get(unlock))["destination_url"] == "https://example.com/path"

    def test_auto_seconds_validation_and_uuid_slug(self, user: Any, login: Any) -> None:
        """Slug tự sinh là UUID; số giây chỉ trong khoảng cấu hình."""
        grant(user, P.CREATE)
        api = login(user)
        payload = self.payload()
        payload.pop("slug")
        item = self.assert_success(api.post(BASE, payload, format="json"), 201)
        assert len(item["slug"]) == 36
        assert item["slug"].count("-") == 4
        self.assert_error(
            api.post(BASE, self.payload(slug="slow", auto_redirect_seconds=61), format="json"),
            400,
            "VALIDATION_ERROR",
        )
