"""Kiểm thử endpoint cập nhật file đính kèm: PATCH /api/v1/attachments/{id}."""

from collections.abc import Generator
from typing import Any

import pytest

from app.attachment.models.attachment import Attachment
from app.attachment.models.attachment_folder import AttachmentFolder
from app.attachment.permissions.attachment_permission import AttachmentPermission
from app.attachment.tests.helpers.attachment_test_helper import (
    PNG_BYTES,
    upload_file,
)
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/attachments"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentUpdateApi(BaseApiTestCase):
    """Kiểm thử cập nhật tên hiển thị, alt text và thư mục của file đính kèm."""

    def test_update_original_name_and_alt_text_success(self, superuser: Any, login: Any) -> None:
        """Cập nhật tên file và alt text thành công."""
        api = login(superuser)
        uploaded = self.assert_success(upload_file(api, "anh-goc.png", PNG_BYTES, "image/png"), 201)

        res = api.patch(
            f"{BASE_URL}/{uploaded['id']}",
            {"original_name": "anh-moi.png", "alt_text": "Mô tả ảnh avatar"},
            format="json",
        )
        data = self.assert_success(res, 200)

        assert data["id"] == uploaded["id"]
        assert data["original_name"] == "anh-moi.png"
        assert data["alt_text"] == "Mô tả ảnh avatar"

        stored = Attachment.objects.get(pk=uploaded["id"])
        assert stored.original_name == "anh-moi.png"
        assert stored.alt_text == "Mô tả ảnh avatar"

    def test_update_folder_id_success(self, superuser: Any, login: Any) -> None:
        """Chuyển file sang thư mục logic khác thành công."""
        api = login(superuser)
        uploaded = self.assert_success(upload_file(api, "file.png", PNG_BYTES, "image/png"), 201)
        folder = AttachmentFolder.objects.create(name="Thư mục test", created_by=superuser)

        res = api.patch(
            f"{BASE_URL}/{uploaded['id']}",
            {"folder_id": str(folder.pk)},
            format="json",
        )
        data = self.assert_success(res, 200)
        assert data["folder_id"] == str(folder.pk)

        stored = Attachment.objects.get(pk=uploaded["id"])
        assert stored.folder_id == folder.pk

    def test_update_empty_name_validation_error(self, superuser: Any, login: Any) -> None:
        """Tên file để trống bị lỗi 400 VALIDATION_ERROR."""
        api = login(superuser)
        uploaded = self.assert_success(upload_file(api, "valid.png", PNG_BYTES, "image/png"), 201)

        res = api.patch(
            f"{BASE_URL}/{uploaded['id']}",
            {"original_name": "   "},
            format="json",
        )
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_update_owner_isolation_other_user_404(self, user: Any, superuser: Any, login: Any) -> None:
        """Không thể sửa file của người khác nếu không có manage_all (404 bảo mật)."""
        grant(user, AttachmentPermission.FILE_READ, AttachmentPermission.FILE_UPDATE)
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )

        api = login(user)
        res = api.patch(
            f"{BASE_URL}/{foreign['id']}",
            {"original_name": "hack.png"},
            format="json",
        )
        self.assert_error(res, 404, "NOT_FOUND")

    def test_update_manage_all_can_update_other_user(self, user: Any, superuser: Any, login: Any) -> None:
        """Có quyền FILE_MANAGE_ALL thì sửa được file của người khác."""
        grant(
            user,
            AttachmentPermission.FILE_READ,
            AttachmentPermission.FILE_UPDATE,
            AttachmentPermission.FILE_MANAGE_ALL,
        )
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )

        api = login(user)
        res = api.patch(
            f"{BASE_URL}/{foreign['id']}",
            {"original_name": "updated-by-manager.png", "alt_text": "Alt text quản lý"},
            format="json",
        )
        data = self.assert_success(res, 200)
        assert data["original_name"] == "updated-by-manager.png"
        assert data["alt_text"] == "Alt text quản lý"

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(
            f"{BASE_URL}/00000000-0000-0000-0000-000000000000",
            {"original_name": "test.png"},
            format="json",
        )
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, superuser: Any, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền FILE_UPDATE bị 403."""
        file = self.assert_success(upload_file(login(superuser), "file.png", PNG_BYTES, "image/png"), 201)
        grant(user, AttachmentPermission.FILE_READ)
        api = login(user)
        res = api.patch(
            f"{BASE_URL}/{file['id']}",
            {"original_name": "forbidden.png"},
            format="json",
        )
        self.assert_forbidden(res)
