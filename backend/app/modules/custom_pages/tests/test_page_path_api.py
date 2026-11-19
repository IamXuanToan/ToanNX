"""Test API đường dẫn giữa /custom_pages/paths."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.custom_pages.permissions.page_path_permission import PagePathPermission as P
from app.modules.custom_pages.permissions.page_permission import PagePermission
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
PATHS = "/api/v1/custom_pages/paths"
PAGES = "/api/v1/custom_pages/pages"


class TestPagePathApi(BaseApiTestCase):
    """CRUD đường dẫn giữa (PagePath)."""

    def test_seed_crud_and_rules(self, user: Any, login: Any) -> None:
        """Kiểm tra phân quyền, tạo, validate và xóa đường dẫn giữa."""
        api = login(user)
        self.assert_forbidden(api.get(PATHS))
        grant(
            user,
            P.PATH_READ,
            P.PATH_CREATE,
            P.PATH_UPDATE,
            P.PATH_DELETE,
            PagePermission.CREATE,
            PagePermission.READ,
        )
        segments = [item["segment"] for item in self.assert_success(api.get(PATHS))]
        assert segments[:2] == ["p", "qr"]
        created = self.assert_success(
            api.post(PATHS, {"segment": "Events", "name": "Sự kiện"}, format="json"), 201
        )
        assert created["segment"] == "events" and created["page_count"] == 0
        self.assert_error(api.post(PATHS, {"segment": "events", "name": "x"}, format="json"), 409)
        self.assert_error(api.post(PATHS, {"segment": "admin", "name": "x"}, format="json"), 400)
        self.assert_error(api.post(PATHS, {"segment": "s", "name": "x"}, format="json"), 400)
        self.assert_success(
            api.post(PAGES, {"path_id": created["id"], "title": "A", "slug": "a-page"}, format="json"), 201
        )
        self.assert_error(api.delete(f"{PATHS}/{created['id']}"), 409, "CUSTOM_PAGES_PATH_IN_USE")
        empty = self.assert_success(api.post(PATHS, {"segment": "tmp", "name": "Tạm"}, format="json"), 201)
        assert api.delete(f"{PATHS}/{empty['id']}").status_code == 204
