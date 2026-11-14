"""Test /system/modules."""

from typing import Any

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.system.permissions.system_permission import SystemPermission

pytestmark = pytest.mark.django_db

MODULES = "/api/v1/system/modules"


class TestModuleApi(BaseApiTestCase):
    """API module."""

    def test_list_requires_permission(self, staff: Any, staff_with: Any, login: Any) -> None:
        self.assert_forbidden(login(staff).get(MODULES), "PERMISSION_DENIED")
        data = self.assert_success(login(staff_with(SystemPermission.MODULE_READ)).get(MODULES))
        iam = next(item for item in data if item["code"] == "iam")
        assert iam["is_core"] and iam["enabled"] and iam["installed"] and iam["group"] == "system"
        assert "iam.role.read" in iam["permissions"]

    def test_patch_core_module_rejected(self, superuser: Any, login: Any) -> None:
        response = login(superuser).patch(f"{MODULES}/iam", {"enabled": False}, format="json")
        self.assert_error(response, 422, "MODULE_CORE_LOCKED")

    def test_patch_unknown_module(self, superuser: Any, login: Any) -> None:
        response = login(superuser).patch(f"{MODULES}/novels", {"enabled": True}, format="json")
        self.assert_error(response, 404, "MODULE_NOT_INSTALLED")

    def test_patch_requires_manage_permission(self, staff_with: Any, login: Any) -> None:
        member = staff_with(SystemPermission.MODULE_READ)
        self.assert_forbidden(login(member).patch(f"{MODULES}/iam", {"enabled": False}, format="json"))


SVG_ICON = (
    b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
)
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture
def _media_root(settings: Any, tmp_path: Any) -> None:
    """Lưu file test vào thư mục tạm."""
    settings.MEDIA_ROOT = tmp_path


def _upload(api: Any, name: str, content: bytes) -> str:
    response = api.post(
        "/api/v1/attachments",
        {"file": SimpleUploadedFile(name, content, "application/octet-stream")},
        format="multipart",
    )
    assert response.status_code == 201, response.json()
    return str(response.json()["data"]["id"])


@pytest.mark.usefixtures("_media_root")
class TestModuleIcon(BaseApiTestCase):
    """Icon module: tên lucide hoặc SVG tự upload."""

    def test_default_icon_from_descriptor(self, superuser: Any, login: Any) -> None:
        data = self.assert_success(login(superuser).get(MODULES))
        iam = next(item for item in data if item["code"] == "iam")
        assert iam["icon"] == "shield-check" and iam["icon_url"] is None

    def test_set_and_reset_lucide_icon_on_core_module(self, superuser: Any, login: Any) -> None:
        api = login(superuser)
        data = self.assert_success(api.patch(f"{MODULES}/iam", {"icon": "lock-keyhole"}, format="json"))
        assert data["icon"] == "lock-keyhole" and data["enabled"]
        data = self.assert_success(api.patch(f"{MODULES}/iam", {"icon": ""}, format="json"))
        assert data["icon"] == "shield-check"

    def test_invalid_icon_name(self, superuser: Any, login: Any) -> None:
        response = login(superuser).patch(f"{MODULES}/iam", {"icon": "<script>"}, format="json")
        error = self.assert_error(response, 400, "VALIDATION_ERROR")
        assert "icon" in error["details"]

    def test_empty_body_rejected(self, superuser: Any, login: Any) -> None:
        self.assert_error(
            login(superuser).patch(f"{MODULES}/iam", {}, format="json"), 400, "VALIDATION_ERROR"
        )

    def test_svg_icon_absolute_url_and_clear(self, superuser: Any, login: Any) -> None:
        api = login(superuser)
        icon_id = _upload(api, "icon.svg", SVG_ICON)
        data = self.assert_success(api.patch(f"{MODULES}/iam", {"icon_id": icon_id}, format="json"))
        assert data["icon_url"].startswith("http://testserver/media/attachments/")
        data = self.assert_success(api.patch(f"{MODULES}/iam", {"icon_id": None}, format="json"))
        assert data["icon_url"] is None

    def test_icon_must_be_svg(self, superuser: Any, login: Any) -> None:
        api = login(superuser)
        png_id = _upload(api, "icon.png", PNG_BYTES)
        response = api.patch(f"{MODULES}/iam", {"icon_id": png_id}, format="json")
        error = self.assert_error(response, 400, "VALIDATION_ERROR")
        assert "icon_id" in error["details"]
