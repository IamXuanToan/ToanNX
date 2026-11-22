"""Kiểm thử POST /api/v1/system/attachments/{id}/visibility (chuyển công khai/riêng tư)."""

from typing import Any

import pytest
from django.core.files.storage import storages

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.models.journal_entry import JournalEntry
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.attachment_test_helper import PNG_BYTES, upload_file
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


def _url(pk: Any) -> str:
    return f"/api/v1/system/attachments/{pk}/visibility"


@pytest.fixture
def owner(db: Any) -> Any:
    """Người upload có quyền tạo và sửa file."""
    user = UserFactory()
    grant(user, AttachmentPermission.FILE_CREATE, AttachmentPermission.FILE_UPDATE)
    return user


def _upload(api: Any, visibility: str) -> Attachment:
    res = upload_file(api, "cccd.png", PNG_BYTES, "image/png", visibility=visibility)
    return Attachment.objects.get(pk=BaseApiTestCase.assert_success(res, 201)["id"])


class TestAttachmentVisibilityApi(BaseApiTestCase):
    """Chuyển kho giữ id, xóa bản cũ, ghi lịch sử."""

    def test_public_to_private_moves_file(
        self, owner: Any, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        """Chuyển sang riêng tư: file sang kho riêng tư, bản công khai bị xóa, URL thành URL API."""
        api = login(owner)
        attachment = _upload(api, "public")
        old_name = attachment.file.name
        with django_capture_on_commit_callbacks(execute=True):
            res = api.post(_url(attachment.pk), {"visibility": "private"}, format="json")
        data = self.assert_success(res)
        attachment.refresh_from_db()
        assert data["visibility"] == "private"
        assert data["url"].endswith(f"/api/v1/system/attachments/{attachment.pk}/content")
        assert storages["private"].exists(attachment.file.name)
        assert not storages["default"].exists(old_name)
        assert JournalEntry.objects.filter(object_id=str(attachment.pk)).exists()

    def test_private_to_public_moves_file(
        self, owner: Any, login: Any, django_capture_on_commit_callbacks: Any
    ) -> None:
        """Chuyển sang công khai: file về kho công khai, bản riêng tư bị xóa."""
        api = login(owner)
        attachment = _upload(api, "private")
        old_name = attachment.file.name
        with django_capture_on_commit_callbacks(execute=True):
            data = self.assert_success(api.post(_url(attachment.pk), {"visibility": "public"}, format="json"))
        attachment.refresh_from_db()
        assert data["visibility"] == "public"
        assert storages["default"].exists(attachment.file.name)
        assert not storages["private"].exists(old_name)

    def test_copy_failure_keeps_original(self, owner: Any, login: Any, monkeypatch: Any) -> None:
        """Chép sang kho đích lỗi: DB và file cũ giữ nguyên."""
        from app.system.services.attachment_storage_service import AttachmentStorageService

        api = login(owner)
        attachment = _upload(api, "public")

        def _boom(self: Any, item: Any, target: str) -> str:
            raise OSError("r2 down")

        monkeypatch.setattr(AttachmentStorageService, "copy_to", _boom)
        res = api.post(_url(attachment.pk), {"visibility": "private"}, format="json")
        assert res.status_code == 500
        attachment.refresh_from_db()
        assert attachment.visibility == "public"
        assert storages["default"].exists(attachment.file.name)

    def test_other_user_cannot_change(self, owner: Any, login: Any) -> None:
        """File của người khác (không có manage_all) → 404."""
        attachment = _upload(login(owner), "public")
        other = UserFactory()
        grant(other, AttachmentPermission.FILE_UPDATE)
        res = login(other).post(_url(attachment.pk), {"visibility": "private"}, format="json")
        self.assert_error(res, 404)

    def test_forbidden_without_permission(self, owner: Any, login: Any) -> None:
        """Thiếu quyền sửa file → 403."""
        attachment = _upload(login(owner), "public")
        res = login(UserFactory()).post(_url(attachment.pk), {"visibility": "private"}, format="json")
        self.assert_forbidden(res)

    def test_invalid_value_rejected(self, owner: Any, login: Any) -> None:
        """Giá trị ngoài public/private → 400."""
        attachment = _upload(login(owner), "public")
        res = login(owner).post(_url(attachment.pk), {"visibility": "secret"}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_private_image_rejected_as_avatar(self, owner: Any, login: Any) -> None:
        """Ảnh riêng tư không dùng làm ảnh đại diện (người khác phải xem được)."""
        grant(owner, AttachmentPermission.FILE_READ)
        api = login(owner)
        attachment = _upload(api, "private")
        res = api.patch("/api/v1/system/auth/me", {"avatar_id": str(attachment.pk)}, format="json")
        self.assert_error(res, 400, "ATTACHMENT_MUST_BE_PUBLIC")
