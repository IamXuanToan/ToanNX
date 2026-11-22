"""Kiểm thử endpoint nội dung trang công khai: GET /api/v1/utilities/pages/public/{path_segment}/{slug}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.services.page_service import PageService
from app.utilities.services.short_link_service import ShortLinkService
from app.utilities.tests.helpers.page_test_helper import (
    get_seeded_path,
    make_doc,
    make_paragraph,
)

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/pages/public"


class TestPagePublicApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint hiển thị trang công khai cho độc giả và xem trước bản nháp."""

    def test_public_published_page_success(self, user: Any, client: Any) -> None:
        """Độc giả vãng lai xem được trang đã PUBLISHED kèm header cache và canonical_url."""
        qr_path = get_seeded_path("qr")
        page = Page.objects.create(
            owner=user,
            path=qr_path,
            title="Ủng Hộ",
            slug="ung-ho",
            status=Page.Status.PUBLISHED,
            content=make_doc(make_paragraph("Cảm ơn bạn đã ủng hộ!")),
        )

        res = client.get(f"{BASE_URL}/{qr_path.segment}/{page.slug}")
        data = self.assert_success(res, 200)

        assert data["preview"] is False
        assert res["Cache-Control"] == "public, max-age=60"
        assert data["canonical_url"] == "http://testserver/qr/ung-ho"
        # Không để lộ thông tin nhạy cảm của owner hay id trang
        assert "owner" not in data and "id" not in data

    def test_public_draft_hidden_from_anonymous_404(self, user: Any, client: Any) -> None:
        """Khách vãng lai không xem được trang ở trạng thái DRAFT (trả về 404 NOT_FOUND)."""
        qr_path = get_seeded_path("qr")
        page = Page.objects.create(
            owner=user,
            path=qr_path,
            title="Nháp",
            slug="draft-page",
            status=Page.Status.DRAFT,
        )

        res = client.get(f"{BASE_URL}/{qr_path.segment}/{page.slug}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_public_draft_preview_by_owner(self, user: Any, login: Any) -> None:
        """Chủ sở hữu đăng nhập thì xem trước được bản nháp với cờ preview=True và header noindex/no-store."""
        grant(user, P.READ)
        qr_path = get_seeded_path("qr")
        page = Page.objects.create(
            owner=user,
            path=qr_path,
            title="Nháp Của Tôi",
            slug="my-draft",
            status=Page.Status.DRAFT,
        )

        api = login(user)
        res = api.get(f"{BASE_URL}/{qr_path.segment}/{page.slug}")
        data = self.assert_success(res, 200)

        assert data["preview"] is True
        assert res["Cache-Control"] == "private, no-store"
        assert res["X-Robots-Tag"] == "noindex"

    def test_public_draft_hidden_from_other_users(self, user: Any, login: Any) -> None:
        """Người dùng khác (không phải owner và không có MANAGE_ALL) không xem được nháp của người khác."""
        grant(user, P.READ)
        other_user = UserFactory()
        grant(other_user, P.READ)

        qr_path = get_seeded_path("qr")
        page = Page.objects.create(
            owner=user,
            path=qr_path,
            title="Nháp Riêng",
            slug="private-draft",
            status=Page.Status.DRAFT,
        )

        api_other = login(other_user)
        res = api_other.get(f"{BASE_URL}/{qr_path.segment}/{page.slug}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_public_inactive_short_link_dropped_from_content(self, user: Any, client: Any) -> None:
        """Button trỏ tới short link đã bị INACTIVE sẽ tự động được lọc bỏ khỏi nội dung công khai."""
        p_path = get_seeded_path("p")
        link = ShortLinkService().create(
            user, {"name": "GitHub", "slug": "my-gh", "destination_url": "https://github.com"}
        )

        content = make_doc(
            make_paragraph("Xin chào"),
            {"type": "button", "attrs": {"label": "GitHub", "shortLinkId": str(link.pk)}},
        )
        page = Page.objects.create(
            owner=user,
            path=p_path,
            title="Bio",
            slug="bio-page",
            status=Page.Status.PUBLISHED,
            content=content,
        )

        # 1. Khi link còn ACTIVE -> hiển thị cả button
        res1 = client.get(f"{BASE_URL}/{p_path.segment}/{page.slug}")
        data1 = self.assert_success(res1, 200)
        assert [n["type"] for n in data1["content"]["content"]] == ["paragraph", "button"]

        # 2. Khi link chuyển sang INACTIVE -> button tự động biến mất
        ShortLink.objects.filter(pk=link.pk).update(status=ShortLink.Status.INACTIVE)
        res2 = client.get(f"{BASE_URL}/{p_path.segment}/{page.slug}")
        data2 = self.assert_success(res2, 200)
        assert [n["type"] for n in data2["content"]["content"]] == ["paragraph"]

    def test_public_not_found(self, client: Any) -> None:
        """Segment hoặc slug không tồn tại trả về 404 NOT_FOUND."""
        res = client.get(f"{BASE_URL}/nonexistent/not-found")
        self.assert_error(res, 404, "NOT_FOUND")


class TestPagePublicCache(BaseApiTestCase):
    """Có Redis: trang đã xuất bản lần sau không chạm DB; bản nháp không cache; sửa trang làm mới ngay."""

    def _page(self, owner: Any, status: str = Page.Status.PUBLISHED) -> Page:
        return Page.objects.create(
            owner=owner,
            path=get_seeded_path("p"),
            title="Giới thiệu",
            slug="gioi-thieu",
            status=status,
            content=make_doc(make_paragraph("Xin chào")),
        )

    def test_published_page_served_from_cache(
        self, user: Any, client: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        page = self._page(user)
        client.get(f"{BASE_URL}/p/{page.slug}")
        with django_assert_num_queries(0):
            res = client.get(f"{BASE_URL}/p/{page.slug}")
        assert self.assert_success(res, 200)["title"] == "Giới thiệu"

    def test_draft_is_never_cached(self, user: Any, client: Any, fake_redis: FakeRedis) -> None:
        page = self._page(user, Page.Status.DRAFT)
        assert client.get(f"{BASE_URL}/p/{page.slug}").status_code == 404
        assert not any(":page:" in key for key in fake_redis.data)

    def test_update_invalidates_cache(
        self, user: Any, client: Any, fake_redis: FakeRedis, django_capture_on_commit_callbacks: Any
    ) -> None:
        page = self._page(user)
        client.get(f"{BASE_URL}/p/{page.slug}")
        with django_capture_on_commit_callbacks(execute=True):
            PageService().update(user, page.pk, {"title": "Đã sửa"})
        assert self.assert_success(client.get(f"{BASE_URL}/p/{page.slug}"), 200)["title"] == "Đã sửa"
