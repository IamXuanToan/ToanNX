"""Test /attachments và ảnh đại diện người dùng."""

from collections.abc import Iterator
from typing import Any

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission

pytestmark = pytest.mark.django_db

ATTACHMENTS = "/api/v1/attachments"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF_BYTES = b"%PDF-1.7\n" + b"\x00" * 64
SAFE_SVG = (
    b'<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
    b'<defs><linearGradient id="g"/></defs><path d="M0 0h24v24H0z" fill="url(#g)"/></svg>'
)
UNSAFE_SVGS = {
    "script": b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    "event": b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
    "external_href": (
        b'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
        b'<image xlink:href="https://evil.test/x.png"/></svg>'
    ),
    "foreign_object": b'<svg xmlns="http://www.w3.org/2000/svg"><foreignObject/></svg>',
    "css_import": b'<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(x.css);</style></svg>',
    "entity": (
        b'<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "y">]>'
        b'<svg xmlns="http://www.w3.org/2000/svg">&x;</svg>'
    ),
}


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Iterator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


def _upload(api: Any, name: str, content: bytes, content_type: str) -> Any:
    return api.post(
        ATTACHMENTS, {"file": SimpleUploadedFile(name, content, content_type)}, format="multipart"
    )


class TestAttachmentApi(BaseApiTestCase):
    """Upload, đọc, xóa file."""

    def test_upload_image(self, superuser: Any, login: Any) -> None:
        response = _upload(login(superuser), "avatar.png", PNG_BYTES, "image/png")
        data = self.assert_success(response, 201)
        assert data["content_type"] == "image/png"
        assert data["size"] == len(PNG_BYTES)
        assert data["url"].startswith("http://testserver/media/attachments/")
        attachment = Attachment.objects.get(pk=data["id"])
        assert attachment.created_by_id == superuser.pk
        assert len(attachment.checksum) == 64

    def test_url_uses_forwarded_domain(self, superuser: Any, login: Any, settings: Any) -> None:
        settings.ALLOWED_HOSTS = ["testserver", "app.toannx.test"]
        api = login(superuser)
        response = api.post(
            ATTACHMENTS,
            {"file": SimpleUploadedFile("a.png", PNG_BYTES, "image/png")},
            format="multipart",
            HTTP_X_FORWARDED_HOST="app.toannx.test",
            HTTP_X_FORWARDED_PROTO="https",
        )
        data = self.assert_success(response, 201)
        assert data["url"].startswith("https://app.toannx.test/media/attachments/")

    def test_upload_safe_svg(self, superuser: Any, login: Any) -> None:
        data = self.assert_success(_upload(login(superuser), "icon.svg", SAFE_SVG, "text/plain"), 201)
        assert data["content_type"] == "image/svg+xml"

    @pytest.mark.parametrize("case", sorted(UNSAFE_SVGS))
    def test_unsafe_svg_rejected(self, case: str, superuser: Any, login: Any) -> None:
        response = _upload(login(superuser), f"{case}.svg", UNSAFE_SVGS[case], "image/svg+xml")
        error = self.assert_error(response, 400, "VALIDATION_ERROR")
        assert "file" in error["details"]

    def test_content_type_detected_from_signature_not_header(self, superuser: Any, login: Any) -> None:
        response = _upload(login(superuser), "fake.png", b"<html>not an image</html>", "image/png")
        error = self.assert_error(response, 400, "VALIDATION_ERROR")
        assert "file" in error["details"]

    def test_too_large(self, superuser: Any, login: Any, settings: Any) -> None:
        settings.ATTACHMENT_MAX_SIZE_BYTES = 10
        response = _upload(login(superuser), "big.png", PNG_BYTES, "image/png")
        self.assert_error(response, 400, "VALIDATION_ERROR")

    def test_requires_permission(self, staff: Any, login: Any) -> None:
        response = _upload(login(staff), "a.png", PNG_BYTES, "image/png")
        error = self.assert_error(response, 403, "PERMISSION_DENIED")
        assert error["details"]["permissions"] == [AttachmentPermission.FILE_CREATE.code]

    def test_get_and_soft_delete(self, superuser: Any, login: Any) -> None:
        api = login(superuser)
        attachment_id = self.assert_success(_upload(api, "doc.pdf", PDF_BYTES, "application/pdf"), 201)["id"]
        assert self.assert_success(api.get(f"{ATTACHMENTS}/{attachment_id}"))["original_name"] == "doc.pdf"
        assert api.delete(f"{ATTACHMENTS}/{attachment_id}").status_code == 204
        assert Attachment.objects.get(pk=attachment_id).deleted_at is not None
        self.assert_error(api.get(f"{ATTACHMENTS}/{attachment_id}"), 404, "NOT_FOUND")


class TestUserAvatar(BaseApiTestCase):
    """Ảnh đại diện là FK tới attachment."""

    def test_set_and_clear_avatar(self, superuser: Any, user: Any, login: Any) -> None:
        api = login(superuser)
        image_id = self.assert_success(_upload(api, "a.png", PNG_BYTES, "image/png"), 201)["id"]
        data = self.assert_success(
            api.patch(f"/api/v1/account/users/{user.pk}", {"avatar_id": image_id}, format="json")
        )
        assert data["avatar"]["id"] == image_id and data["avatar"]["url"].startswith(
            "http://testserver/media/"
        )
        cleared = self.assert_success(
            api.patch(f"/api/v1/account/users/{user.pk}", {"avatar_id": None}, format="json")
        )
        assert cleared["avatar"] is None

    def test_avatar_must_be_image(self, superuser: Any, user: Any, login: Any) -> None:
        api = login(superuser)
        pdf_id = self.assert_success(_upload(api, "doc.pdf", PDF_BYTES, "application/pdf"), 201)["id"]
        response = api.patch(f"/api/v1/account/users/{user.pk}", {"avatar_id": pdf_id}, format="json")
        error = self.assert_error(response, 400, "VALIDATION_ERROR")
        assert "avatar_id" in error["details"]
