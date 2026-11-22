"""Kiểm thử tích hợp Avatar người dùng và File đính kèm: PATCH /api/v1/system/users/{id}."""

from collections.abc import Generator
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.permissions.user_permission import UserPermission
from app.system.tests.helpers.attachment_test_helper import (
    PDF_BYTES,
    PNG_BYTES,
    upload_file,
)
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentUserAvatarApi(BaseApiTestCase):
    """Kiểm thử tham chiếu Avatar của Account tới Attachment."""

    def test_set_and_clear_avatar(self, superuser: Any, user: Any, login: Any) -> None:
        """Gán ảnh đại diện và xóa ảnh đại diện (gán None) thành công."""
        api = login(superuser)
        image_id = self.assert_success(upload_file(api, "a.png", PNG_BYTES, "image/png"), 201)["id"]

        data = self.assert_success(
            api.patch(f"/api/v1/system/users/{user.pk}", {"avatar_id": image_id}, format="json")
        )
        assert data["avatar"]["id"] == image_id
        assert data["avatar"]["url"].startswith("http://testserver/media/")

        cleared = self.assert_success(
            api.patch(f"/api/v1/system/users/{user.pk}", {"avatar_id": None}, format="json")
        )
        assert cleared["avatar"] is None

    def test_avatar_must_be_image(self, superuser: Any, user: Any, login: Any) -> None:
        """Gán file không phải ảnh (PDF) làm avatar bị 400 VALIDATION_ERROR."""
        api = login(superuser)
        pdf_id = self.assert_success(upload_file(api, "doc.pdf", PDF_BYTES, "application/pdf"), 201)["id"]

        res = api.patch(f"/api/v1/system/users/{user.pk}", {"avatar_id": pdf_id}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "avatar_id" in error["details"]

    def test_avatar_id_cannot_bypass_owner(self, staff: Any, user: Any, superuser: Any, login: Any) -> None:
        """Account không thể gán ảnh ngoài phạm vi sở hữu của mình."""
        foreign = self.assert_success(
            upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201
        )
        grant(staff, UserPermission.USER_UPDATE, AttachmentPermission.FILE_READ)

        api = login(staff)
        url = f"/api/v1/system/users/{user.pk}"
        self.assert_error(api.patch(url, {"avatar_id": foreign["id"]}, format="json"), 404, "NOT_FOUND")

        # Có MANAGE_ALL thì được phép gán
        grant(staff, AttachmentPermission.FILE_MANAGE_ALL)
        res = login(staff).patch(url, {"avatar_id": foreign["id"]}, format="json")
        assert self.assert_success(res)["avatar"]["id"] == foreign["id"]

    def test_deleted_avatar_disappears(self, superuser: Any, user: Any, login: Any) -> None:
        """Ảnh bị xóa mềm thì trường avatar của user và /auth/me tự động thành None."""
        api = login(superuser)
        image = self.assert_success(upload_file(api, "avatar.png", PNG_BYTES, "image/png"), 201)
        api.patch(f"/api/v1/system/users/{user.pk}", {"avatar_id": image["id"]}, format="json")

        assert api.delete(f"/api/v1/system/attachments/{image['id']}").status_code == 204
        assert self.assert_success(api.get(f"/api/v1/system/users/{user.pk}"))["avatar"] is None
        assert self.assert_success(login(user).get("/api/v1/system/auth/me"))["user"]["avatar"] is None

    def test_avatar_reference_requires_read_permission(
        self, staff: Any, user: Any, superuser: Any, login: Any
    ) -> None:
        """Gán avatar tham chiếu sang attachment phải có quyền FILE_READ."""
        image = self.assert_success(upload_file(login(superuser), "avatar.png", PNG_BYTES, "image/png"), 201)
        grant(staff, UserPermission.USER_UPDATE, AttachmentPermission.FILE_MANAGE_ALL)

        res = login(staff).patch(f"/api/v1/system/users/{user.pk}", {"avatar_id": image["id"]}, format="json")
        error = self.assert_error(res, 403, "PERMISSION_DENIED")
        assert error["details"]["permissions"] == [AttachmentPermission.FILE_READ.code]
