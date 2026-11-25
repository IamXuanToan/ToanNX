"""Kiểm thử GET /api/v1/system/attachments/{id}/content (mở nội dung file sau khi kiểm quyền)."""

from typing import Any
from uuid import uuid4

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.attachment_test_helper import CSV_BYTES, PNG_BYTES, SAFE_SVG, upload_file
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


def _url(pk: Any) -> str:
    return f"/api/v1/system/attachments/{pk}/content"


def _upload(api: Any, name: str, content: bytes, visibility: str) -> dict[str, Any]:
    res = upload_file(api, name, content, "application/octet-stream", visibility=visibility)
    return BaseApiTestCase.assert_success(res, 201)


@pytest.fixture
def owner(db: Any) -> Any:
    """Người upload có quyền tạo file."""
    user = UserFactory()
    grant(user, AttachmentPermission.FILE_CREATE, AttachmentPermission.FILE_READ)
    return user


class TestAttachmentContentApi(BaseApiTestCase):
    """Chỉ người upload, superuser và người có quyền xem riêng tư mở được file riêng tư."""

    def test_owner_streams_private_file(self, owner: Any, login: Any) -> None:
        """Kho riêng tư trên filesystem: stream nội dung, không cache, không đoán kiểu."""
        api = login(owner)
        data = _upload(api, "cccd.png", PNG_BYTES, "private")
        res = api.get(_url(data["id"]))
        assert res.status_code == 200
        assert b"".join(res.streaming_content) == PNG_BYTES
        assert res["Cache-Control"] == "private, no-store"
        assert res["X-Content-Type-Options"] == "nosniff"
        assert res["Content-Type"] == "image/png"

    def test_csv_is_download_only(self, owner: Any, login: Any) -> None:
        """CSV/XLSX/XML/SVG luôn tải về, không hiển thị inline trong trình duyệt khi mở qua API."""
        api = login(owner)
        data = _upload(api, "sao-ke.csv", CSV_BYTES, "private")
        res = api.get(_url(data["id"]))
        assert res.status_code == 200
        assert res["Content-Disposition"].startswith("attachment;")

    def test_svg_is_download_only(self, owner: Any, login: Any) -> None:
        """File SVG riêng tư phục vụ với Content-Disposition: attachment để chặn thực thi inline."""
        api = login(owner)
        data = _upload(api, "icon.svg", SAFE_SVG, "private")
        res = api.get(_url(data["id"]))
        assert res.status_code == 200
        assert res["Content-Type"] == "image/svg+xml"
        assert res["Content-Disposition"].startswith("attachment;")

    def test_other_user_gets_same_404_as_missing(self, owner: Any, login: Any) -> None:
        """Người khác (kể cả có quyền đọc Thư viện, manage_all) nhận đúng 404 như file không tồn tại."""
        data = _upload(login(owner), "cccd.png", PNG_BYTES, "private")
        other = UserFactory()
        grant(other, AttachmentPermission.FILE_READ, AttachmentPermission.FILE_MANAGE_ALL)
        api = login(other)
        forbidden = self.assert_error(api.get(_url(data["id"])), 404)
        missing = self.assert_error(api.get(_url(uuid4())), 404)
        forbidden.pop("request_id", None)
        missing.pop("request_id", None)
        assert forbidden == missing

    def test_read_private_permission_opens_others_file(self, owner: Any, login: Any) -> None:
        """Quyền `system.attachment.read_private` mở được file riêng tư của người khác."""
        data = _upload(login(owner), "cccd.png", PNG_BYTES, "private")
        reader = UserFactory()
        grant(reader, AttachmentPermission.FILE_READ_PRIVATE)
        assert login(reader).get(_url(data["id"])).status_code == 200

    def test_superuser_opens_private_file(self, owner: Any, superuser: Any, login: Any) -> None:
        """Superuser mở được mọi file riêng tư."""
        data = _upload(login(owner), "cccd.png", PNG_BYTES, "private")
        assert login(superuser).get(_url(data["id"])).status_code == 200

    def test_public_file_redirects_to_public_url(self, owner: Any, login: Any) -> None:
        """File công khai: chuyển tới URL công khai."""
        api = login(owner)
        data = _upload(api, "logo.png", PNG_BYTES, "public")
        res = api.get(_url(data["id"]))
        assert res.status_code == 302
        assert res["Location"] == data["url"]

    def test_deleted_file_is_404(self, owner: Any, login: Any) -> None:
        """File đã xóa mềm không mở được."""
        grant(owner, AttachmentPermission.FILE_DELETE)
        api = login(owner)
        data = _upload(api, "cccd.png", PNG_BYTES, "private")
        api.delete(f"/api/v1/system/attachments/{data['id']}")
        self.assert_error(api.get(_url(data["id"])), 404)

    def test_r2_private_redirects_to_short_signed_url(self, owner: Any, login: Any, monkeypatch: Any) -> None:
        """Kho riêng tư có link ký: 302 tới link ký kèm kiểu nội dung, không cache."""
        from app.system.services.attachment_storage_service import AttachmentStorageService

        api = login(owner)
        data = _upload(api, "cccd.png", PNG_BYTES, "private")
        monkeypatch.setattr(
            AttachmentStorageService, "signed_url", lambda self, attachment: "https://r2.test/signed?X-Amz=1"
        )
        res = api.get(_url(data["id"]))
        assert res.status_code == 302
        assert res["Location"] == "https://r2.test/signed?X-Amz=1"
        assert res["Cache-Control"] == "private, no-store"

    def test_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.get(_url(uuid4())))

    def test_stream_public_file_returns_bytes_same_origin(self, owner: Any, login: Any) -> None:
        """`?stream=1`: file công khai trả nội dung qua backend (trình sửa ảnh, không cần CORS R2)."""
        api = login(owner)
        data = _upload(api, "logo.png", PNG_BYTES, "public")
        res = api.get(_url(data["id"]), {"stream": "1"})
        assert res.status_code == 200
        assert b"".join(res.streaming_content) == PNG_BYTES
        assert res["Content-Type"] == "image/png"
        assert res["Cache-Control"] == "private, no-store"

    def test_stream_private_r2_file_skips_signed_url(self, owner: Any, login: Any, monkeypatch: Any) -> None:
        """`?stream=1` với kho có link ký: vẫn stream nội dung, không redirect sang bucket."""
        from app.system.services.attachment_storage_service import AttachmentStorageService

        api = login(owner)
        data = _upload(api, "cccd.png", PNG_BYTES, "private")
        monkeypatch.setattr(
            AttachmentStorageService, "signed_url", lambda self, attachment: "https://r2.test/signed?X-Amz=1"
        )
        res = api.get(_url(data["id"]), {"stream": "1"})
        assert res.status_code == 200
        assert b"".join(res.streaming_content) == PNG_BYTES

    def test_stream_other_user_private_file_is_404(self, owner: Any, login: Any) -> None:
        """Chế độ stream vẫn kiểm quyền như cũ: file riêng tư của người khác là 404."""
        data = _upload(login(owner), "cccd.png", PNG_BYTES, "private")
        stranger = UserFactory()
        grant(stranger, AttachmentPermission.FILE_READ)
        self.assert_error(login(stranger).get(_url(data["id"]), {"stream": "1"}), 404)
