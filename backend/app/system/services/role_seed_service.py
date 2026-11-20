"""Service khởi tạo và chuẩn hóa vai trò mẫu: `ADMIN` và hai vai trò cho mỗi module.

Là nguồn duy nhất tạo vai trò mẫu: sau mỗi `migrate` (post_migrate) chỉ tạo/chuẩn hóa vai trò hệ thống
`ADMIN`; lệnh `seed_roles` tạo thêm `<MÃ_MODULE>_MANAGER` (mọi quyền của module) và `<MÃ_MODULE>_VIEWER`
(chỉ quyền `read`).
"""

from collections.abc import Sequence
from fnmatch import fnmatchcase

from django.db import transaction

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.system.constants.predefined_roles import (
    ADMIN_ROLE,
    MODULE_MANAGER_CODE,
    MODULE_MANAGER_DESCRIPTION,
    MODULE_MANAGER_NAME,
    MODULE_MANAGER_PATTERN,
    MODULE_VIEWER_CODE,
    MODULE_VIEWER_DESCRIPTION,
    MODULE_VIEWER_NAME,
    MODULE_VIEWER_PATTERN,
)
from app.system.models.permission import Permission
from app.system.models.role import Role
from app.system.models.role_auto_grant import RoleAutoGrant
from app.system.repositories.permission_repository import PermissionRepository
from app.system.repositories.role_permission_repository import RolePermissionRepository
from app.system.repositories.role_repository import RoleRepository
from app.system.services.iam_sync_service import IamSyncService
from app.system.types.predefined_role_spec import PredefinedRoleSpec

# Field của vai trò lấy theo khai báo mẫu; `code` là khóa tìm nên không nằm ở đây.
SPEC_FIELDS = ("name", "description", "is_system", "auto_grant")


class RoleSeedService:
    """Tạo/chuẩn hóa vai trò mẫu và cấp quyền cho chúng."""

    def __init__(
        self,
        role_repository: RoleRepository | None = None,
        permission_repository: PermissionRepository | None = None,
        role_permission_repository: RolePermissionRepository | None = None,
        sync_service: IamSyncService | None = None,
        registry: ModuleRegistry | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            role_repository: Repository vai trò.
            permission_repository: Repository quyền.
            role_permission_repository: Repository gán quyền cho vai trò.
            sync_service: Service đồng bộ danh mục quyền và cấp quyền theo `auto_grant`.
            registry: Module registry (nguồn danh sách module để dựng vai trò theo module).
        """
        self.role_repository = role_repository or RoleRepository()
        self.permission_repository = permission_repository or PermissionRepository()
        self.role_permission_repository = role_permission_repository or RolePermissionRepository()
        self.sync_service = sync_service or IamSyncService()
        self.registry = registry or module_registry

    def predefined_roles(self) -> list[PredefinedRoleSpec]:
        """Danh sách vai trò mẫu: `ADMIN` rồi cặp quản lý/chỉ xem của từng module có khai quyền.

        Returns:
            Khai báo vai trò theo thứ tự tạo.
        """
        specs = [ADMIN_ROLE]
        for module in self.registry.all():
            if module.permissions:
                specs.extend(self._module_roles(module))
        return specs

    @staticmethod
    def _module_roles(module: ModuleDescriptor) -> tuple[PredefinedRoleSpec, PredefinedRoleSpec]:
        """Hai vai trò của một module: quản lý (mọi quyền) và chỉ xem (quyền `read`).

        Args:
            module: Descriptor của module.

        Returns:
            (vai trò quản lý, vai trò chỉ xem).
        """
        # Mã vai trò là CHỮ_HOA_SNAKE (`ROLE_CODE_PATTERN`) nên đổi `-` trong mã module thành `_`.
        role_prefix = module.code.upper().replace("-", "_")
        manager = PredefinedRoleSpec(
            code=MODULE_MANAGER_CODE.format(module=role_prefix),
            name=MODULE_MANAGER_NAME.format(module=module.name),
            description=MODULE_MANAGER_DESCRIPTION.format(module=module.name),
            permission_patterns=(MODULE_MANAGER_PATTERN.format(module=module.code),),
        )
        viewer = PredefinedRoleSpec(
            code=MODULE_VIEWER_CODE.format(module=role_prefix),
            name=MODULE_VIEWER_NAME.format(module=module.name),
            description=MODULE_VIEWER_DESCRIPTION.format(module=module.name),
            permission_patterns=(MODULE_VIEWER_PATTERN.format(module=module.code),),
        )
        return manager, viewer

    @transaction.atomic
    def seed(self, *, system_only: bool = False) -> dict[str, int]:
        """Tạo/chuẩn hóa vai trò mẫu, đồng bộ quyền rồi cấp quyền theo khai báo.

        Args:
            system_only: Chỉ xử lý vai trò hệ thống `ADMIN` (dùng sau `migrate`); vai trò theo module do
                `seed_roles` tạo để quản trị viên chủ động chọn.

        Returns:
            Thống kê: roles_created, roles_updated, permissions_granted.
        """
        specs = [spec for spec in self.predefined_roles() if spec.is_system or not system_only]

        # ============================================================
        # BƯỚC 1: Tạo hoặc chuẩn hóa vai trò theo khai báo
        # ============================================================
        roles_created = 0
        roles_updated = 0
        roles: list[tuple[PredefinedRoleSpec, Role]] = []
        for spec in specs:
            role, created, updated = self._upsert_role(spec)
            roles_created += int(created)
            roles_updated += int(updated)
            roles.append((spec, role))

        # ============================================================
        # BƯỚC 2: Đồng bộ danh mục quyền; vai trò có auto_grant (kể cả vừa tạo) nhận quyền tại đây
        # ============================================================
        self.sync_service.sync()

        # ============================================================
        # BƯỚC 3: Cấp quyền theo mẫu cho vai trò không tự cấp quyền
        # ============================================================
        active_permissions = list(self.permission_repository.get_all())
        permissions_granted = 0
        for spec, role in roles:
            if spec.auto_grant == RoleAutoGrant.NONE and spec.permission_patterns:
                expected = self._resolve_permissions(spec.permission_patterns, active_permissions)
                permissions_granted += self.role_permission_repository.add_missing(role, expected)

        return {
            "roles_created": roles_created,
            "roles_updated": roles_updated,
            "permissions_granted": permissions_granted,
        }

    def _upsert_role(self, spec: PredefinedRoleSpec) -> tuple[Role, bool, bool]:
        """Tạo vai trò nếu chưa có, ngược lại đưa các field về đúng khai báo.

        Args:
            spec: Khai báo vai trò mẫu.

        Returns:
            (vai trò, có tạo mới, có cập nhật).
        """
        values = {field: getattr(spec, field) for field in SPEC_FIELDS}
        role = self.role_repository.find_one(code=spec.code)
        if role is None:
            return self.role_repository.create(code=spec.code, **values), True, False

        changes = {field: value for field, value in values.items() if getattr(role, field) != value}
        if changes:
            self.role_repository.update(role, **changes)
        return role, False, bool(changes)

    @staticmethod
    def _matches(code: str, pattern: str) -> bool:
        """Mã quyền có khớp mẫu không (`*` khớp một hoặc nhiều đoạn: `system.*`, `system.*.read`).

        Args:
            code: Mã quyền.
            pattern: Mã quyền hoặc mẫu có `*`.

        Returns:
            True nếu khớp.
        """
        return fnmatchcase(code, pattern)

    def _resolve_permissions(
        self, patterns: Sequence[str], permissions: list[Permission]
    ) -> list[Permission]:
        """Lọc các quyền đang hoạt động khớp ít nhất một mẫu.

        Args:
            patterns: Mã quyền hoặc mẫu.
            permissions: Quyền đang hoạt động.

        Returns:
            Quyền khớp.
        """
        return [
            item for item in permissions if any(self._matches(item.code, pattern) for pattern in patterns)
        ]
