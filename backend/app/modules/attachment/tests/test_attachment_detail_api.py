"""Kiểm thử endpoint chi tiết file đính kèm: GET /api/v1/attachments/{id}."""

from collections.abc import Generator
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.tests.helpers.attachment_test_helper import (
    PDF_BYTES,
    PNG_BYTES,
    upload_file,
)
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/attachments"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentDetailApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/attachments/{id}."""

    def test_detail_success(self, superuser: Any, login: Any) -> None:
        """Lấy chi tiết file thành công."""
        api = login(superuser)
        uploaded = self.assert_success(upload_file(api, "doc.pdf", PDF_BYTES, "application/pdf"), 201)

        res = api.get(f"{BASE_URL}/{uploaded['id']}")
        data = self.assert_success(res, 200)

        assert data["id"] == uploaded["id"]
        assert data["original_name"] == "doc.pdf"
        assert data["content_type"] == "application/pdf"

    def test_detail_owner_isolation_other_user_404(self, user: Any, superuser: Any, login: Any) -> None:
        """Không thể xem chi tiết file của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, AttachmentPermission.FILE_READ)
        foreign = self.assert_success(upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201)

        api = login(user)
        res = api.get(f"{BASE_URL}/{foreign['id']}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_manage_all_can_access_other_user(self, user: Any, superuser: Any, login: Any) -> None:
        """Có quyền FILE_MANAGE_ALL thì xem được file của người khác."""
        grant(user, AttachmentPermission.FILE_READ, AttachmentPermission.FILE_MANAGE_ALL)
        foreign = self.assert_success(upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201)

        api = login(user)
        res = api.get(f"{BASE_URL}/{foreign['id']}")
        data = self.assert_success(res, 200)
        assert data["id"] == foreign["id"]

    def test_detail_not_found(self, user: Any, login: Any) -> None:
        """ID không tồn tại trả về 404 NOT_FOUND."""
        grant(user, AttachmentPermission.FILE_READ)
        api = login(user)
        res = api.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_detail_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_detail_forbidden_without_permission(self, superuser: Any, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền FILE_READ bị 403."""
        file = self.assert_success(upload_file(login(superuser), "file.png", PNG_BYTES, "image/png"), 201)
        api = login(user)
        res = api.get(f"{BASE_URL}/{file['id']}")
        self.assert_forbidden(res)
