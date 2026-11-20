"""Kiểm thử service khởi tạo vai trò mẫu: `ADMIN` và cặp quản lý/chỉ xem cho mỗi module."""

import pytest

from app.core.registry.module_registry import module_registry
from app.system.models.permission import Permission
from app.system.models.role import Role
from app.system.models.role_auto_grant import RoleAutoGrant
from app.system.services.role_seed_service import RoleSeedService

pytestmark = pytest.mark.django_db


def _module_codes() -> list[str]:
    """Mã các module có khai quyền (mỗi module sinh hai vai trò)."""
    return [module.code for module in module_registry.all() if module.permissions]


def _codes(role: Role) -> set[str]:
    """Mã quyền đang gán cho vai trò."""
    return set(role.role_permissions.values_list("permission__code", flat=True))


class TestRoleSeedService:
    """Kiểm tra vai trò mẫu dựng theo module registry."""

    def test_predefined_roles_are_admin_plus_two_per_module(self) -> None:
        """Danh sách mẫu chỉ gồm ADMIN và `<MODULE>_MANAGER`/`<MODULE>_VIEWER`, không có vai trò tự đặt."""
        codes = [spec.code for spec in RoleSeedService().predefined_roles()]

        expected = ["ADMIN"]
        for module in _module_codes():
            expected += [f"{module.upper()}_MANAGER", f"{module.upper()}_VIEWER"]
        assert codes == expected
        assert {"SYSTEM_MANAGER", "SYSTEM_VIEWER", "NOVEL_MANAGER", "UTILITIES_VIEWER"} <= set(codes)

    def test_migrate_creates_only_admin(self) -> None:
        """Sau migrate (post_migrate) chỉ có vai trò hệ thống ADMIN, đủ mọi quyền đang hoạt động."""
        admin = Role.objects.alive().get(code="ADMIN")

        assert admin.is_system is True
        assert admin.auto_grant == RoleAutoGrant.ALL
        assert _codes(admin) == set(Permission.objects.filter(is_active=True).values_list("code", flat=True))
        assert not Role.objects.alive().filter(code__endswith="_MANAGER").exists()

    def test_seed_creates_module_roles_with_module_permissions(self) -> None:
        """`seed()` tạo vai trò theo module: quản lý có mọi quyền của module, chỉ xem có quyền `read`."""
        result = RoleSeedService().seed()

        assert result["roles_created"] == 2 * len(_module_codes())
        for module in _module_codes():
            module_codes = set(
                Permission.objects.filter(is_active=True, code__startswith=f"{module}.").values_list(
                    "code", flat=True
                )
            )
            manager = Role.objects.alive().get(code=f"{module.upper()}_MANAGER")
            viewer = Role.objects.alive().get(code=f"{module.upper()}_VIEWER")

            assert manager.is_system is False and manager.auto_grant == RoleAutoGrant.NONE
            assert _codes(manager) == module_codes
            assert _codes(viewer) == {code for code in module_codes if code.endswith(".read")}

    def test_seed_system_only_keeps_admin_only(self) -> None:
        """`seed(system_only=True)` (chạy sau migrate) không tạo vai trò theo module."""
        result = RoleSeedService().seed(system_only=True)

        assert result["roles_created"] == 0
        assert list(Role.objects.alive().values_list("code", flat=True)) == ["ADMIN"]

    def test_seed_restores_changed_fields(self) -> None:
        """Vai trò mẫu bị sửa tên được đưa về đúng khai báo khi chạy lại."""
        service = RoleSeedService()
        service.seed()
        Role.objects.filter(code="SYSTEM_VIEWER").update(name="Đổi tên")

        result = service.seed()

        assert result["roles_updated"] == 1
        assert Role.objects.get(code="SYSTEM_VIEWER").name == "Xem System"

    def test_seed_is_idempotent(self) -> None:
        """Chạy lần hai không tạo, không sửa và không gán thêm gì."""
        service = RoleSeedService()
        service.seed()

        result = service.seed()

        assert result == {"roles_created": 0, "roles_updated": 0, "permissions_granted": 0}
