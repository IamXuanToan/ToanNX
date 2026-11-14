"""Tiện ích cấp quyền cho test."""

from app.core.registry.permission_definition import PermissionDefinition
from app.modules.account.models.user import User
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_permission import RolePermission
from app.modules.iam.models.user_role import UserRole
from app.modules.iam.tests.factories.role_factory import RoleFactory


def grant(user: User, *permissions: PermissionDefinition | str) -> Role:
    """Tạo vai trò chứa các quyền và gán cho người dùng.

    Args:
        user: Người dùng.
        *permissions: Định nghĩa quyền hoặc mã quyền (phải tồn tại sau sync).

    Returns:
        Vai trò đã tạo.
    """
    codes = [item.code if isinstance(item, PermissionDefinition) else item for item in permissions]
    role = RoleFactory()
    for permission in Permission.objects.filter(code__in=codes):
        RolePermission.objects.create(role=role, permission=permission)
    UserRole.objects.create(user=user, role=role)
    return role
