"""Kiểm thử service khởi tạo bộ vai trò chuẩn hóa hệ thống."""

import pytest

from app.iam.models.role import Role
from app.iam.models.role_auto_grant import RoleAutoGrant
from app.iam.services.role_seed_service import PREDEFINED_ROLES, RoleSeedService

pytestmark = pytest.mark.django_db


class TestRoleSeedService:
    """Kiểm tra khởi tạo vai trò và gán quyền."""

    def test_seed_creates_and_updates_roles(self) -> None:
        service = RoleSeedService()
        result = service.seed()

        assert result["roles_created"] >= 5
        assert result["permissions_granted"] > 0

        # Mọi vai trò trong PREDEFINED_ROLES đều phải tồn tại trong DB
        for spec in PREDEFINED_ROLES:
            role = Role.objects.alive().filter(code=spec.code).first()
            assert role is not None, f"Vai trò {spec.code} chưa được tạo"
            assert role.name == spec.name
            assert role.description == spec.description
            assert role.is_system == spec.is_system
            assert role.auto_grant == spec.auto_grant

            # Kiểm tra quyền được gán nếu không dùng auto_grant
            if spec.auto_grant == RoleAutoGrant.NONE and spec.permission_patterns:
                perms_count = role.role_permissions.count()
                assert perms_count > 0, f"Vai trò {spec.code} chưa được gán quyền nào"

    def test_seed_is_idempotent(self) -> None:
        service = RoleSeedService()
        service.seed()
        # Chạy lần 2 không tạo thêm gì mới
        result2 = service.seed()
        assert result2["roles_created"] == 0
        assert result2["roles_updated"] == 0
        assert result2["permissions_granted"] == 0
