"""Kiểm thử endpoint nhân bản trang: POST /api/v1/utilities/pages/{id}/duplicate."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/pages"


class TestPageDuplicateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/pages/{id}/duplicate."""

    def test_duplicate_success_creates_draft_copy(self, user: Any, login: Any) -> None:
        """Nhân bản trang thành công: bản sao ở trạng thái DRAFT, tiêu đề thêm (bản sao), slug mới."""
        grant(user, P.CREATE, P.READ)
        path = get_seeded_path("p")
        page = Page.objects.create(
            owner=user, path=path, title="Trang Chính", slug="trang-chinh", status=Page.Status.PUBLISHED
        )

        api = login(user)
        res = api.post(f"{BASE_URL}/{page.pk}/duplicate")
        copy = self.assert_success(res, 201)

        assert copy["status"] == "DRAFT"
        assert copy["title"] == "Trang Chính (bản sao)"
        assert copy["slug"] != page.slug
        assert copy["owner"]["id"] == str(user.pk)

    def test_duplicate_owner_isolation_other_user_404(self, user: Any, login: Any) -> None:
        """Không thể nhân bản trang của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, P.CREATE, P.READ)
        other_user = UserFactory()
        path = get_seeded_path("p")
        other_page = Page.objects.create(owner=other_user, path=path, title="Trang Khác", slug="other-dup")

        api = login(user)
        res = api.post(f"{BASE_URL}/{other_page.pk}/duplicate")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_duplicate_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(f"{BASE_URL}/00000000-0000-0000-0000-000000000000/duplicate")
        self.assert_unauthorized(res)

    def test_duplicate_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.page.create bị 403."""
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang", slug="p")
        api = login(user)
        res = api.post(f"{BASE_URL}/{page.pk}/duplicate")
        self.assert_forbidden(res)
