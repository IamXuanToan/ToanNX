"""Model của IAM. Django nạp model qua `app.modules.iam.models` nên phải import tại đây."""

from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_permission import RolePermission
from app.modules.iam.models.user_role import UserRole

__all__ = ["Permission", "Role", "RolePermission", "UserRole"]
