"""Kiểm thử endpoint upload file đính kèm: POST /api/v1/system/attachments."""

from collections.abc import Generator
from typing import Any

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.attachment import Attachment
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.helpers.attachment_test_helper import (
    PNG_BYTES,
    SAFE_SVG,
    UNSAFE_SVGS,
    upload_file,
)

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/attachments"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/attachments."""

    def test_upload_image_success(self, superuser: Any, login: Any) -> None:
        """Upload file ảnh PNG thành công, tính toán đúng checksum và kích thước."""
        api = login(superuser)
        res = upload_file(api, "avatar.png", PNG_BYTES, "image/png")
        data = self.assert_success(res, 201)

        assert data["content_type"] == "image/png"
        assert data["size"] == len(PNG_BYTES)
        assert data["url"].startswith("http://testserver/media/attachments/")

        attachment = Attachment.objects.get(pk=data["id"])
        assert attachment.created_by_id == superuser.pk
        assert len(attachment.checksum) == 64

    def test_url_uses_forwarded_domain(self, superuser: Any, login: Any, settings: Any) -> None:
        """URL trả về sử dụng domain forwarded nếu có cấu hình."""
        settings.ALLOWED_HOSTS = ["testserver", "app.toannx.test"]
        api = login(superuser)
        res = api.post(
            URL,
            {"file": SimpleUploadedFile("a.png", PNG_BYTES, "image/png")},
            format="multipart",
            HTTP_X_FORWARDED_HOST="app.toannx.test",
            HTTP_X_FORWARDED_PROTO="https",
        )
        data = self.assert_success(res, 201)
        assert data["url"].startswith("https://app.toannx.test/media/attachments/")

    def test_upload_safe_svg_success(self, superuser: Any, login: Any) -> None:
        """Upload file SVG an toàn thành công với kiểu mime image/svg+xml."""
        api = login(superuser)
        res = upload_file(api, "icon.svg", SAFE_SVG, "text/plain")
        data = self.assert_success(res, 201)
        assert data["content_type"] == "image/svg+xml"

    @pytest.mark.parametrize("case", sorted(UNSAFE_SVGS))
    def test_unsafe_svg_rejected(self, case: str, superuser: Any, login: Any) -> None:
        """Các file SVG độc hại (script, event, external href...) bị từ chối 400."""
        api = login(superuser)
        res = upload_file(api, f"{case}.svg", UNSAFE_SVGS[case], "image/svg+xml")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "file" in error["details"]

    def test_content_type_detected_from_signature_not_header(self, superuser: Any, login: Any) -> None:
        """Kiểm tra content type dựa trên signature byte thực tế, không tin header client gửi lên."""
        api = login(superuser)
        res = upload_file(api, "fake.png", b"<html>not an image</html>", "image/png")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "file" in error["details"]

    def test_too_large_file_rejected(self, superuser: Any, login: Any, settings: Any) -> None:
        """File vượt quá giới hạn kích thước tối đa bị từ chối 400."""
        settings.ATTACHMENT_MAX_SIZE_BYTES = 10
        api = login(superuser)
        res = upload_file(api, "big.png", PNG_BYTES, "image/png")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_upload_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(
            URL, {"file": SimpleUploadedFile("a.png", PNG_BYTES, "image/png")}, format="multipart"
        )
        self.assert_unauthorized(res)

    def test_upload_forbidden_without_permission(self, staff: Any, login: Any) -> None:
        """Thiếu quyền FILE_CREATE bị 403."""
        api = login(staff)
        res = upload_file(api, "a.png", PNG_BYTES, "image/png")
        error = self.assert_error(res, 403, "PERMISSION_DENIED")
        assert error["details"]["permissions"] == [AttachmentPermission.FILE_CREATE.code]
