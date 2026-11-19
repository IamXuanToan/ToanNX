"""Kiểm thử endpoint lấy cấu trúc template import: GET /api/v1/novel/novels/import-template."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.iam.tests.helpers.permission_helper import grant
from app.modules.novel.permissions.novel_permission import NovelPermission

pytestmark = pytest.mark.django_db
URL = "/api/v1/novel/novels/import-template"


class TestNovelImportTemplateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/novel/novels/import-template."""

    def test_import_template_success(self, user: Any, login: Any) -> None:
        """Lấy cấu trúc JSON template mẫu import thành công."""
        grant(user, NovelPermission.READ, NovelPermission.IMPORT)
        api = login(user)

        res = api.get(URL)
        data = self.assert_success(res, 200)

        assert "format_version" in data
        assert "novel" in data
        assert "title" in data["novel"]
        assert "chapters" in data
        assert isinstance(data["chapters"], list)

    def test_import_template_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_import_template_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền bị 403."""
        api = login(user)
        res = api.get(URL)
        self.assert_forbidden(res)
