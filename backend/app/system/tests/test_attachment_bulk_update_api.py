"""Kiểm thử endpoint cập nhật hàng loạt file đính kèm: POST /api/v1/system/attachments/bulk-update."""

from collections.abc import Generator
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.models.attachment_folder import AttachmentFolder
from app.system.permissions.attachment_folder_permission import AttachmentFolderPermission
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.helpers.attachment_test_helper import (
    PNG_BYTES,
    upload_file,
)
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/attachments/bulk-update"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/attachments/bulk-update."""

    def test_bulk_update_move_to_folder_success(self, user: Any, login: Any) -> None:
        """Di chuyển hàng loạt file vào thư mục thành công."""
        grant(
            user,
            AttachmentPermission.FILE_CREATE,
            AttachmentPermission.FILE_UPDATE,
            AttachmentFolderPermission.FOLDER_CREATE,
            AttachmentFolderPermission.FOLDER_READ,
        )
        folder = AttachmentFolder.objects.create(name="Images", created_by=user)
        api = login(user)
        f1 = self.assert_success(upload_file(api, "f1.png", PNG_BYTES, "image/png"), 201)
        f2 = self.assert_success(upload_file(api, "f2.png", PNG_BYTES, "image/png"), 201)

        payload = {"ids": [f1["id"], f2["id"]], "folder_id": str(folder.pk)}
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

        assert Attachment.objects.get(pk=f1["id"]).folder_id == folder.pk
        assert Attachment.objects.get(pk=f2["id"]).folder_id == folder.pk

    def test_bulk_update_owner_isolation_other_user_404(self, user: Any, superuser: Any, login: Any) -> None:
        """Không thể di chuyển file của người khác (trả về 404 NOT_FOUND)."""
        grant(user, AttachmentPermission.FILE_CREATE, AttachmentPermission.FILE_UPDATE)
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )

        api = login(user)
        own = self.assert_success(upload_file(api, "own.png", PNG_BYTES, "image/png"), 201)

        res = api.post(URL, {"ids": [own["id"], foreign["id"]], "folder_id": None}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền FILE_UPDATE bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
