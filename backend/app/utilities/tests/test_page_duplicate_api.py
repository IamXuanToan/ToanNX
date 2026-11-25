"""Kiểm thử endpoint nhân bản trang: POST /api/v1/utilities/pages/{id}/duplicate."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
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

    def test_duplicate_strips_sepay_webhook_token_from_qr_codes(self, user: Any, login: Any) -> None:
        """Nhân bản trang không sao chép webhookToken / webhook_token của SePay QR."""
        grant(user, P.CREATE, P.READ)
        path = get_seeded_path("p")
        page = Page.objects.create(
            owner=user,
            path=path,
            title="Trang Quyên Góp",
            slug="trang-quyen-gop-dup",
            status=Page.Status.PUBLISHED,
            content_config={
                "qrCodes": [
                    {
                        "id": "qr-1",
                        "label": "MBBank",
                        "webhookToken": "secret-token-camel",
                        "webhook_token": "secret-token-snake",
                    }
                ],
                "qr_codes": [
                    {
                        "id": "qr-2",
                        "webhookToken": "secret-token-2",
                    }
                ],
            },
        )

        res = login(user).post(f"{BASE_URL}/{page.pk}/duplicate")
        copy = self.assert_success(res, 201)
        duplicated = Page.objects.get(pk=copy["id"])
        assert "webhookToken" not in duplicated.content_config["qrCodes"][0]
        assert "webhook_token" not in duplicated.content_config["qrCodes"][0]
        assert "webhookToken" not in duplicated.content_config["qr_codes"][0]
        assert duplicated.content_config["qrCodes"][0]["label"] == "MBBank"
