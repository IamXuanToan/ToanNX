"""Service khởi tạo và chuẩn hóa bộ vai trò mẫu theo phân cấp module."""

from collections.abc import Sequence
from dataclasses import dataclass

from django.db import transaction

from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_auto_grant import RoleAutoGrant
from app.modules.iam.repositories.permission_repository import PermissionRepository
from app.modules.iam.repositories.role_permission_repository import RolePermissionRepository
from app.modules.iam.repositories.role_repository import RoleRepository
from app.modules.iam.services.iam_sync_service import IamSyncService


@dataclass(frozen=True)
class PredefinedRoleSpec:
    """Khai báo cấu trúc vai trò mẫu."""

    code: str
    name: str
    description: str
    is_system: bool = False
    auto_grant: str = RoleAutoGrant.NONE
    permission_patterns: Sequence[str] = ()


PREDEFINED_ROLES: tuple[PredefinedRoleSpec, ...] = (
    # 1. Quản trị viên toàn hệ thống
    PredefinedRoleSpec(
        code="ADMIN",
        name="Quản trị viên",
        description="Toàn bộ quyền quản trị của các module đã cài.",
        is_system=True,
        auto_grant=RoleAutoGrant.ALL,
    ),
    # 2. Người xem / Giám sát / Kiểm toán
    PredefinedRoleSpec(
        code="VIEWER",
        name="Người xem",
        description="Chỉ có quyền xem danh sách và chi tiết (*.read) trên toàn hệ thống.",
        is_system=True,
        auto_grant=RoleAutoGrant.READ_ONLY,
    ),
    # 3. Quản lý người dùng & bảo mật (Account, IAM, Authentication, Journal)
    PredefinedRoleSpec(
        code="USER_MANAGER",
        name="Quản lý người dùng",
        description="Quản lý tài khoản, phân vai trò IAM và kiểm soát phiên đăng nhập.",
        is_system=False,
        permission_patterns=(
            "account.user.*",
            "iam.role.read",
            "iam.role.assign",
            "iam.permission.read",
            "authentication.session.read",
            "authentication.session.revoke",
            "journal.entry.read",
        ),
    ),
    # 4. Quản lý nội dung (Custom Pages, Attachment, Short Links, QR Codes)
    PredefinedRoleSpec(
        code="CONTENT_MANAGER",
        name="Quản lý nội dung",
        description="Quản trị toàn bộ nội dung xuất bản: trang tùy chỉnh, file media, link rút gọn, mã QR.",
        is_system=False,
        permission_patterns=(
            "custom_pages.page.*",
            "custom_pages.path.*",
            "attachment.file.*",
            "attachment.folder.*",
            "short_links.link.*",
            "qr_codes.code.*",
        ),
    ),
    # 5. Quản lý truyện (Toàn bộ phân hệ Novel & Upload thumbnail file)
    PredefinedRoleSpec(
        code="NOVEL_MANAGER",
        name="Quản lý truyện",
        description="Toàn quyền quản trị phân hệ truyện: truyện, chương, tác giả, thể loại, thẻ và import.",
        is_system=False,
        permission_patterns=(
            "novel.novel.*",
            "novel.chapter.*",
            "novel.author.*",
            "novel.genre.*",
            "novel.tag.*",
            "attachment.file.read",
            "attachment.file.create",
        ),
    ),
    # 6. Tác giả / Biên tập viên sáng tác truyện
    PredefinedRoleSpec(
        code="NOVEL_AUTHOR",
        name="Tác giả truyện",
        description="Tạo và sửa truyện, chương của chính mình; tra cứu tác giả, thể loại, thẻ.",
        is_system=False,
        permission_patterns=(
            "novel.novel.read",
            "novel.novel.create",
            "novel.novel.update",
            "novel.chapter.read",
            "novel.chapter.create",
            "novel.chapter.update",
            "novel.author.read",
            "novel.genre.read",
            "novel.tag.read",
            "novel.tag.create",
            "attachment.file.read",
            "attachment.file.create",
        ),
    ),
    # 7. Chuyên viên tiếp thị & Tăng trưởng (Marketing, QR, Short links)
    PredefinedRoleSpec(
        code="MARKETING_MANAGER",
        name="Chuyên viên tiếp thị",
        description="Quản lý chiến dịch tiếp thị: rút gọn liên kết, tạo mã QR và tài nguyên marketing.",
        is_system=False,
        permission_patterns=(
            "short_links.link.*",
            "qr_codes.code.*",
            "attachment.file.read",
            "attachment.file.create",
            "attachment.file.update",
        ),
    ),
)


class RoleSeedService:
    """Service khởi tạo bộ vai trò chuẩn theo phân cấp module."""

    def __init__(
        self,
        role_repository: RoleRepository | None = None,
        permission_repository: PermissionRepository | None = None,
        role_permission_repository: RolePermissionRepository | None = None,
        sync_service: IamSyncService | None = None,
    ) -> None:
        self.role_repository = role_repository or RoleRepository()
        self.permission_repository = permission_repository or PermissionRepository()
        self.role_permission_repository = role_permission_repository or RolePermissionRepository()
        self.sync_service = sync_service or IamSyncService()

    @staticmethod
    def _matches(code: str, pattern: str) -> bool:
        """Kiểm tra mã quyền có khớp pattern không (ví dụ 'novel.novel.*' hoặc 'account.user.read')."""
        if pattern.endswith(".*"):
            prefix = pattern[:-2] + "."
            return code.startswith(prefix)
        return code == pattern

    def _resolve_permissions(
        self, patterns: Sequence[str], active_permissions: list[Permission]
    ) -> list[Permission]:
        """Lọc các quyền hoạt động khớp với danh sách pattern."""
        matched: list[Permission] = []
        for perm in active_permissions:
            if any(self._matches(perm.code, pat) for pat in patterns):
                matched.append(perm)
        return matched

    @transaction.atomic
    def seed(self) -> dict[str, int]:
        """Khởi tạo và đồng bộ quyền cho toàn bộ vai trò mẫu.

        Returns:
            Thống kê: roles_created, roles_updated, permissions_granted.
        """
        # Bước 1: Đảm bảo danh mục quyền trong DB đã đồng bộ mới nhất từ code
        self.sync_service.sync()

        active_permissions = list(self.permission_repository.get_all())
        roles_created = 0
        roles_updated = 0
        permissions_granted = 0

        for spec in PREDEFINED_ROLES:
            existing = Role.objects.alive().filter(code=spec.code).first()
            if existing is None:
                role = Role.objects.create(
                    code=spec.code,
                    name=spec.name,
                    description=spec.description,
                    is_system=spec.is_system,
                    auto_grant=spec.auto_grant,
                )
                roles_created += 1
            else:
                role = existing
                updated_fields: list[str] = []
                if role.name != spec.name:
                    role.name = spec.name
                    updated_fields.append("name")
                if role.description != spec.description:
                    role.description = spec.description
                    updated_fields.append("description")
                if role.is_system != spec.is_system:
                    role.is_system = spec.is_system
                    updated_fields.append("is_system")
                if role.auto_grant != spec.auto_grant:
                    role.auto_grant = spec.auto_grant
                    updated_fields.append("auto_grant")
                if updated_fields:
                    role.save(update_fields=updated_fields)
                    roles_updated += 1

            # Gán quyền theo pattern nếu vai trò không cấu hình auto_grant
            if spec.auto_grant == RoleAutoGrant.NONE and spec.permission_patterns:
                expected_perms = self._resolve_permissions(spec.permission_patterns, active_permissions)
                permissions_granted += self.role_permission_repository.add_missing(role, expected_perms)

        return {
            "roles_created": roles_created,
            "roles_updated": roles_updated,
            "permissions_granted": permissions_granted,
        }
