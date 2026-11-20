"""Kiểm thử endpoint xóa hàng loạt file đính kèm: POST /api/v1/attachments/bulk-delete."""

from collections.abc import Generator
from typing import Any

import pytest

from app.attachment.models.attachment import Attachment
from app.attachment.permissions.attachment_permission import AttachmentPermission
from app.attachment.tests.helpers.attachment_test_helper import (
    PNG_BYTES,
    upload_file,
)
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/attachments/bulk-delete"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/attachments/bulk-delete."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        """Xóa mềm hàng loạt file của chính mình thành công."""
        grant(user, AttachmentPermission.FILE_CREATE, AttachmentPermission.FILE_DELETE)
        api = login(user)
        f1 = self.assert_success(upload_file(api, "f1.png", PNG_BYTES, "image/png"), 201)
        f2 = self.assert_success(upload_file(api, "f2.png", PNG_BYTES, "image/png"), 201)

        res = api.post(URL, {"ids": [f1["id"], f2["id"]]}, format="json")
        data = self.assert_success(res, 200)
        assert data["count"] == 2

        att1 = Attachment.objects.get(pk=f1["id"])
        att2 = Attachment.objects.get(pk=f2["id"])
        assert att1.deleted_at is not None
        assert att2.deleted_at is not None
        assert att1.purged_at is not None
        assert att2.purged_at is not None
        assert not att1.file.storage.exists(att1.file.name)
        assert not att2.file.storage.exists(att2.file.name)

    def test_bulk_delete_owner_isolation_atomic_rollback(self, user: Any, superuser: Any, login: Any) -> None:
        """File ngoài phạm vi làm rollback toàn bộ lô xóa; bản ghi của mình không bị xóa."""
        grant(user, AttachmentPermission.FILE_CREATE, AttachmentPermission.FILE_DELETE)
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )

        api = login(user)
        own = self.assert_success(upload_file(api, "own.png", PNG_BYTES, "image/png"), 201)

        res = api.post(URL, {"ids": [own["id"], foreign["id"]]}, format="json")
        self.assert_error(res, 404, "NOT_FOUND")

        assert Attachment.objects.get(pk=own["id"]).deleted_at is None
        assert Attachment.objects.get(pk=foreign["id"]).deleted_at is None

    def test_bulk_delete_validation_missing_ids(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu ids."""
        grant(user, AttachmentPermission.FILE_DELETE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": []}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền FILE_DELETE bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": []}, format="json")
        self.assert_forbidden(res)
