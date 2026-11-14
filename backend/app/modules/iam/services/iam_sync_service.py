"""Đồng bộ quyền từ module registry vào database và cấp quyền theo cấu hình vai trò.

Idempotent: chạy sau mỗi `migrate` (post_migrate) và qua lệnh `sync_iam`.
Không hardcode mã vai trò: vai trò nào tự nhận quyền do field `Role.auto_grant` quyết định.
"""

from django.db import transaction

from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.modules.iam.models.role_auto_grant import RoleAutoGrant
from app.modules.iam.repositories.permission_repository import PermissionRepository
from app.modules.iam.repositories.role_permission_repository import RolePermissionRepository
from app.modules.iam.repositories.role_repository import RoleRepository


class IamSyncService:
    """Đồng bộ quyền và cấp quyền tự động."""

    def __init__(
        self,
        registry: ModuleRegistry | None = None,
        permission_repository: PermissionRepository | None = None,
        role_repository: RoleRepository | None = None,
        role_permission_repository: RolePermissionRepository | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            registry: Module registry.
            permission_repository: Repository quyền.
            role_repository: Repository vai trò.
            role_permission_repository: Repository gán quyền.
        """
        self.registry = registry or module_registry
        self.permission_repository = permission_repository or PermissionRepository()
        self.role_repository = role_repository or RoleRepository()
        self.role_permission_repository = role_permission_repository or RolePermissionRepository()

    @transaction.atomic
    def sync(self) -> dict[str, int]:
        """Đồng bộ.

        Returns:
            Thống kê: quyền tạo mới, quyền bị vô hiệu, quyền được cấp tự động.
        """
        # ============================================================
        # BƯỚC 1: Upsert quyền được các module khai báo
        # ============================================================
        definitions = self.registry.permission_definitions()
        created = sum(int(self.permission_repository.upsert_definition(item)) for item in definitions)

        # ============================================================
        # BƯỚC 2: Vô hiệu quyền không còn khai báo
        # ============================================================
        deactivated = self.permission_repository.deactivate_except(item.code for item in definitions)

        # ============================================================
        # BƯỚC 3: Cấp quyền cho vai trò theo cấu hình auto_grant
        # ============================================================
        active = list(self.permission_repository.get_all())
        granted = 0
        for role in self.role_repository.list_auto_grant():
            expected = (
                active if role.auto_grant == RoleAutoGrant.ALL else [p for p in active if p.action == "read"]
            )
            granted += self.role_permission_repository.add_missing(role, expected)

        return {"created": created, "deactivated": deactivated, "granted": granted}
