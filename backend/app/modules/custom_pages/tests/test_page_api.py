"""Custom Pages: đường dẫn giữa, nội dung Tiptap, phiên bản, xem nháp theo quyền, bản công khai."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.custom_pages.models.page_path import PagePath
from app.modules.custom_pages.permissions.page_path_permission import PagePathPermission
from app.modules.custom_pages.permissions.page_permission import PagePermission
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.qr_codes.services.qr_code_service import QrCodeService
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.services.short_link_service import ShortLinkService

pytestmark = pytest.mark.django_db
PAGES = "/api/v1/custom_pages/pages"
PATHS = "/api/v1/custom_pages/paths"
PUBLIC = "/api/v1/custom_pages/public"
ALL = (PagePermission.READ, PagePermission.CREATE, PagePermission.UPDATE, PagePermission.DELETE)


def _doc(*nodes: dict[str, Any]) -> dict[str, Any]:
    return {"type": "doc", "content": list(nodes)}


def _p(text: str) -> dict[str, Any]:
    return {"type": "paragraph", "content": [{"type": "text", "text": text}]}


def _path(segment: str) -> PagePath:
    return PagePath.objects.get(segment=segment)


def _qr_image(owner: Any) -> str:
    qr = QrCodeService().create(
        owner,
        {
            "name": "Ủng hộ",
            "qr_type": "TEXT",
            "content": {"text": "hi"},
            "design": {
                "size": 128,
                "foreground": "#000000",
                "background": "#FFFFFF",
                "margin": 2,
                "error_correction": "M",
            },
        },
    )
    return str(qr.image_id)


class TestPagePaths(BaseApiTestCase):
    """Danh mục chung, chỉ theo quyền."""

    def test_seed_crud_and_rules(self, user: Any, login: Any) -> None:
        api = login(user)
        self.assert_forbidden(api.get(PATHS))
        grant(user, *PagePathPermission.all(), *ALL)
        segments = [item["segment"] for item in self.assert_success(api.get(PATHS))]
        assert segments[:2] == ["p", "qr"]
        created = self.assert_success(
            api.post(PATHS, {"segment": "Events", "name": "Sự kiện"}, format="json"), 201
        )
        assert created["segment"] == "events" and created["page_count"] == 0
        self.assert_error(api.post(PATHS, {"segment": "events", "name": "x"}, format="json"), 409)
        self.assert_error(api.post(PATHS, {"segment": "admin", "name": "x"}, format="json"), 400)
        self.assert_error(api.post(PATHS, {"segment": "s", "name": "x"}, format="json"), 400)
        self.assert_success(
            api.post(PAGES, {"path_id": created["id"], "title": "A", "slug": "a-page"}, format="json"), 201
        )
        self.assert_error(api.delete(f"{PATHS}/{created['id']}"), 409, "CUSTOM_PAGES_PATH_IN_USE")
        empty = self.assert_success(api.post(PATHS, {"segment": "tmp", "name": "Tạm"}, format="json"), 201)
        assert api.delete(f"{PATHS}/{empty['id']}").status_code == 204

    def test_inactive_path_blocks_new_pages(self, user: Any, login: Any) -> None:
        grant(user, *ALL)
        PagePath.objects.filter(segment="qr").update(is_active=False)
        self.assert_error(
            login(user).post(PAGES, {"path_id": str(_path("qr").pk), "title": "x"}, format="json"),
            422,
            "CUSTOM_PAGES_PATH_INACTIVE",
        )


class TestPages(BaseApiTestCase):
    """CRUD, nội dung, phiên bản, bulk, nhân bản, lịch sử."""

    def test_create_slug_scope_and_template(self, user: Any, login: Any) -> None:
        grant(user, *ALL)
        api = login(user)
        page = self.assert_success(
            api.post(
                PAGES,
                {"path_id": str(_path("qr").pk), "title": "Ủng hộ", "slug": "donate", "template": "donate"},
                format="json",
            ),
            201,
        )
        assert page["public_url"] == "http://testserver/qr/donate"
        assert page["content"]["content"][0]["type"] == "heading" and page["content_version"] == 1
        self.assert_error(
            api.post(PAGES, {"path_id": str(_path("qr").pk), "title": "x", "slug": "DONATE"}, format="json"),
            409,
        )
        self.assert_success(
            api.post(PAGES, {"path_id": str(_path("p").pk), "title": "x", "slug": "donate"}, format="json"),
            201,
        )

    def test_content_validation_and_version(self, user: Any, login: Any) -> None:
        grant(user, *ALL)
        api = login(user)
        page = self.assert_success(
            api.post(PAGES, {"path_id": str(_path("p").pk), "title": "T"}, format="json"), 201
        )
        url = f"{PAGES}/{page['id']}"
        bad_node = _doc({"type": "script", "content": []})
        self.assert_error(api.patch(url, {"content": bad_node, "content_version": 1}, format="json"), 400)
        js_link = _doc(
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "x",
                        "marks": [{"type": "link", "attrs": {"href": "javascript:alert(1)"}}],
                    }
                ],
            }
        )
        self.assert_error(api.patch(url, {"content": js_link, "content_version": 1}, format="json"), 400)
        self.assert_error(api.patch(url, {"content": _doc(_p("x"))}, format="json"), 400)

        saved = self.assert_success(
            api.patch(url, {"content": _doc(_p("Một")), "content_version": 1}, format="json")
        )
        assert saved["content_version"] == 2
        self.assert_error(
            api.patch(url, {"content": _doc(_p("Cũ")), "content_version": 1}, format="json"),
            409,
            "CUSTOM_PAGES_VERSION_CONFLICT",
        )

        foreign_image = _doc(
            {"type": "image", "attrs": {"attachmentId": _qr_image(UserFactory()), "alt": "x"}}
        )
        self.assert_error(
            api.patch(url, {"content": foreign_image, "content_version": 2}, format="json"), 400
        )
        own_image = _doc({"type": "image", "attrs": {"attachmentId": _qr_image(user), "alt": "QR"}})
        saved = self.assert_success(
            api.patch(url, {"content": own_image, "content_version": 2}, format="json")
        )
        assert saved["content"]["content"][0]["attrs"]["src"].startswith("http://testserver/media/")

    def test_bulk_duplicate_history(self, user: Any, login: Any) -> None:
        grant(user, *ALL)
        api = login(user)
        page = self.assert_success(
            api.post(PAGES, {"path_id": str(_path("p").pk), "title": "Gốc"}, format="json"), 201
        )
        assert self.assert_success(
            api.post(f"{PAGES}/bulk-update", {"ids": [page["id"]], "status": "PUBLISHED"}, format="json")
        ) == {"count": 1}
        detail = self.assert_success(api.get(f"{PAGES}/{page['id']}"))
        assert detail["status"] == "PUBLISHED" and detail["published_at"]
        copy = self.assert_success(api.post(f"{PAGES}/{page['id']}/duplicate"), 201)
        assert copy["status"] == "DRAFT" and copy["title"] == "Gốc (bản sao)" and copy["slug"] != page["slug"]
        items = self.assert_success(api.get(PAGES, {"status": "DRAFT"}))
        assert [item["id"] for item in items] == [copy["id"]]
        history = self.assert_success(api.get(f"{PAGES}/{page['id']}/history"))
        assert [entry["action"] for entry in history] == ["UPDATE", "CREATE"]


class TestPublicPage(BaseApiTestCase):
    """Bản công khai và bản nháp theo quyền."""

    def test_published_and_preview(self, user: Any, login: Any, client: Any) -> None:
        grant(user, *ALL)
        owner_api = login(user)
        page = self.assert_success(
            owner_api.post(
                PAGES, {"path_id": str(_path("qr").pk), "title": "Nháp", "slug": "nhap"}, format="json"
            ),
            201,
        )
        self.assert_error(client.get(f"{PUBLIC}/qr/nhap"), 404, "NOT_FOUND")
        preview = owner_api.get(f"{PUBLIC}/qr/nhap")
        data = self.assert_success(preview)
        assert data["preview"] is True and preview["Cache-Control"] == "private, no-store"
        assert preview["X-Robots-Tag"] == "noindex"

        stranger = UserFactory()
        grant(stranger, PagePermission.READ)
        self.assert_error(login(stranger).get(f"{PUBLIC}/qr/nhap"), 404, "NOT_FOUND")

        broken = login(UserFactory())
        broken.cookies["access_token"] = "broken-token"
        self.assert_error(broken.get(f"{PUBLIC}/qr/nhap"), 404, "NOT_FOUND")

        owner_api.patch(f"{PAGES}/{page['id']}", {"status": "PUBLISHED"}, format="json")
        response = client.get(f"{PUBLIC}/QR/NHAP")
        public = self.assert_success(response)
        assert public["preview"] is False and response["Cache-Control"] == "public, max-age=60"
        assert "owner" not in public and "id" not in public
        assert public["canonical_url"] == "http://testserver/qr/nhap"

    def test_inactive_short_link_button_is_dropped(self, user: Any, login: Any, client: Any) -> None:
        grant(user, *ALL)
        api = login(user)
        link = ShortLinkService().create(
            user, {"name": "GH", "slug": "gh-link", "destination_url": "https://github.com"}
        )
        content = _doc(
            _p("Xin chào"), {"type": "button", "attrs": {"label": "GitHub", "shortLinkId": str(link.pk)}}
        )
        page = self.assert_success(
            api.post(
                PAGES,
                {
                    "path_id": str(_path("p").pk),
                    "title": "Bio",
                    "slug": "bio",
                    "status": "PUBLISHED",
                    "content": content,
                },
                format="json",
            ),
            201,
        )
        assert page["content"]["content"][1]["attrs"]["href"] == "http://testserver/s/gh-link"
        public = self.assert_success(client.get(f"{PUBLIC}/p/bio"))
        assert [node["type"] for node in public["content"]["content"]] == ["paragraph", "button"]
        ShortLink.objects.filter(pk=link.pk).update(status=ShortLink.Status.INACTIVE)
        public = self.assert_success(client.get(f"{PUBLIC}/p/bio"))
        assert [node["type"] for node in public["content"]["content"]] == ["paragraph"]
