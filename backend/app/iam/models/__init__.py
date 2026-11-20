"""Model của IAM. Django nạp model qua `app.iam.models` nên phải import tại đây."""

from app.iam.models.permission import Permission
from app.iam.models.role import Role
from app.iam.models.role_permission import RolePermission
from app.iam.models.user_role import UserRole

__all__ = ["Permission", "Role", "RolePermission", "UserRole"]
