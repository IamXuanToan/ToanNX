"""Kiểm thử endpoint xóa file đính kèm: DELETE /api/v1/system/attachments/{id}."""

from collections.abc import Generator
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.helpers.attachment_test_helper import (
    PNG_BYTES,
    upload_file,
)
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/system/attachments"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/system/attachments/{id}."""

    def test_delete_success_soft_delete(self, user: Any, login: Any) -> None:
        """Xóa mềm file của chính mình thành công (204 No Content)."""
        grant(user, AttachmentPermission.FILE_CREATE, AttachmentPermission.FILE_DELETE)
        api = login(user)
        uploaded = self.assert_success(upload_file(api, "del.png", PNG_BYTES, "image/png"), 201)

        res = api.delete(f"{BASE_URL}/{uploaded['id']}")
        assert res.status_code == 204

        att = Attachment.objects.get(pk=uploaded["id"])
        assert att.deleted_at is not None
        assert att.deleted_by_id == user.pk
        assert att.purged_at is not None
        assert not att.file.storage.exists(att.file.name)

    def test_delete_owner_isolation_other_user_404(self, user: Any, superuser: Any, login: Any) -> None:
        """Không thể xóa file của người khác (404 NOT_FOUND bảo mật)."""
        grant(user, AttachmentPermission.FILE_DELETE)
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )

        api = login(user)
        res = api.delete(f"{BASE_URL}/{foreign['id']}")
        self.assert_error(res, 404, "NOT_FOUND")

        assert Attachment.objects.get(pk=foreign["id"]).deleted_at is None

    def test_delete_manage_all_still_requires_action_permission(
        self, user: Any, superuser: Any, login: Any
    ) -> None:
        """FILE_MANAGE_ALL chỉ mở rộng phạm vi chứ không thay thế quyền FILE_DELETE (vẫn bị 403)."""
        grant(user, AttachmentPermission.FILE_MANAGE_ALL, AttachmentPermission.FILE_READ)
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )

        api = login(user)
        res = api.delete(f"{BASE_URL}/{foreign['id']}")
        self.assert_forbidden(res)

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, superuser: Any, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền FILE_DELETE bị 403."""
        file = self.assert_success(upload_file(login(superuser), "file.png", PNG_BYTES, "image/png"), 201)
        api = login(user)
        res = api.delete(f"{BASE_URL}/{file['id']}")
        self.assert_forbidden(res)
