"""Kiểm thử endpoint danh sách file đính kèm: GET /api/v1/system/attachments."""

from collections.abc import Generator
from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.tests.helpers.attachment_test_helper import (
    PDF_BYTES,
    PNG_BYTES,
    upload_file,
)
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/attachments"


@pytest.fixture(autouse=True)
def _media_root(settings: Any, tmp_path: Any) -> Generator[None]:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path
    yield


class TestAttachmentListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/system/attachments."""

    def test_list_success_paginated(self, user: Any, login: Any) -> None:
        """Lấy danh sách file có phân trang."""
        grant(user, AttachmentPermission.FILE_READ, AttachmentPermission.FILE_CREATE)
        api = login(user)
        upload_file(api, "img1.png", PNG_BYTES, "image/png")
        upload_file(api, "img2.png", PNG_BYTES, "image/png")
        upload_file(api, "img3.png", PNG_BYTES, "image/png")

        res = api.get(URL, {"page": 1, "page_size": 2})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 2
        assert pagination["total"] == 3
        assert pagination["page"] == 1
        assert pagination["page_size"] == 2

    def test_list_filter_kind_and_content_type(self, superuser: Any, login: Any) -> None:
        """Lọc file theo kind (IMAGE, DOCUMENT) và content_type."""
        api = login(superuser)
        older = self.assert_success(upload_file(api, "find-old.png", PNG_BYTES, "image/png"), 201)
        newer = self.assert_success(upload_file(api, "find-new.pdf", PDF_BYTES, "application/pdf"), 201)

        # 1. Lọc search + kind
        items, _ = self.assert_paginated(
            api.get(URL, {"page": 1, "search": "find-", "kind": "IMAGE,DOCUMENT"})
        )
        assert [item["id"] for item in items] == [newer["id"], older["id"]]

        # 2. Lọc kind=IMAGE
        items_img, _ = self.assert_paginated(api.get(URL, {"page": 1, "kind": "IMAGE"}))
        assert [item["id"] for item in items_img] == [older["id"]]

        # 3. Lọc content_type
        _, meta = self.assert_paginated(
            api.get(URL, {"page": 1, "content_type": "image/png,application/pdf"})
        )
        assert meta["total"] == 2

        # 4. Kind không hợp lệ bị 400
        self.assert_error(api.get(URL, {"kind": "INVALID"}), 400, "VALIDATION_ERROR")

    def test_list_owner_isolation_and_manage_all(self, user: Any, superuser: Any, login: Any) -> None:
        """Thư viện của thành viên là riêng tư; có MANAGE_ALL mới xem được file của người khác."""
        grant(user, AttachmentPermission.FILE_READ, AttachmentPermission.FILE_CREATE)
        self.assert_success(upload_file(login(superuser), "foreign.png", PNG_BYTES, "image/png"), 201)

        api = login(user)
        own = self.assert_success(upload_file(api, "own.png", PNG_BYTES, "image/png"), 201)
        assert own["created_by_id"] == str(user.pk)

        # 1. User chỉ thấy file của mình
        items, meta = self.assert_paginated(api.get(URL, {"page": 1}))
        assert meta["total"] == 1
        assert [item["id"] for item in items] == [own["id"]]

        # 2. Có MANAGE_ALL: thấy file của người khác
        grant(user, AttachmentPermission.FILE_MANAGE_ALL)
        api_managed = login(user)
        items_all, meta_all = self.assert_paginated(api_managed.get(URL, {"page": 1}))
        assert meta_all["total"] == 2

    def test_list_filter_created_by(self, user: Any, superuser: Any, login: Any) -> None:
        """Lọc danh sách file theo created_by (người tạo)."""
        grant(
            user,
            AttachmentPermission.FILE_READ,
            AttachmentPermission.FILE_CREATE,
            AttachmentPermission.FILE_MANAGE_ALL,
        )
        api_user = login(user)
        own = self.assert_success(upload_file(api_user, "own.png", PNG_BYTES, "image/png"), 201)

        api_super = login(superuser)
        foreign = self.assert_success(upload_file(api_super, "foreign.png", PNG_BYTES, "image/png"), 201)

        # Lọc theo chính user
        items, meta = self.assert_paginated(api_user.get(URL, {"page": 1, "created_by": str(user.pk)}))
        assert meta["total"] == 1
        assert items[0]["id"] == own["id"]

        # Lọc theo superuser
        items_super, meta_super = self.assert_paginated(
            api_user.get(URL, {"page": 1, "created_by": str(superuser.pk)})
        )
        assert meta_super["total"] == 1
        assert items_super[0]["id"] == foreign["id"]

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền FILE_READ bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
