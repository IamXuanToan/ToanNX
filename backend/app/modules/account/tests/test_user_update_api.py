"""Kiểm thử endpoint cập nhật người dùng: PATCH /api/v1/account/users/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.account.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/account/users"


class TestUserUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/account/users/{id}."""

    def test_update_user_success(self, superuser: User, user: User, login: Any) -> None:
        """Cập nhật thông tin người dùng thành công."""
        res = login(superuser).patch(f"{URL}/{user.pk}", {"first_name": "Bình"}, format="json")
        data = self.assert_success(res, 200)
        assert data["first_name"] == "Bình"
        user.refresh_from_db()
        assert user.updated_by_id == superuser.pk

    def test_update_user_validation_error(self, superuser: User, user: User, login: Any) -> None:
        """Cập nhật với field lạ hoặc dữ liệu không hợp lệ trả về 400 VALIDATION_ERROR."""
        res = login(superuser).patch(f"{URL}/{user.pk}", {"non_existent_field": "val"}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_staff_cannot_escalate_self(self, staff_with: Any, login: Any) -> None:
        """Staff không thể tự gán quyền superuser cho chính mình (403 ACCOUNT_SELF_MODIFICATION)."""
        member = staff_with(A.USER_UPDATE)
        res = login(member).patch(f"{URL}/{member.pk}", {"is_superuser": True}, format="json")
        self.assert_forbidden(res, "ACCOUNT_SELF_MODIFICATION")

    def test_staff_cannot_grant_superuser_to_others(self, staff_with: Any, user: User, login: Any) -> None:
        """Staff không thể cấp quyền superuser cho người khác (403 ACCOUNT_PRIVILEGE_ESCALATION)."""
        member = staff_with(A.USER_UPDATE)
        res = login(member).patch(f"{URL}/{user.pk}", {"is_superuser": True}, format="json")
        self.assert_forbidden(res, "ACCOUNT_PRIVILEGE_ESCALATION")

    def test_staff_cannot_edit_superuser(self, staff_with: Any, superuser: User, login: Any) -> None:
        """Staff không được phép sửa tài khoản của superuser (403 ACCOUNT_SUPERUSER_PROTECTED)."""
        member = staff_with(A.USER_UPDATE)
        res = login(member).patch(f"{URL}/{superuser.pk}", {"first_name": "hacked"}, format="json")
        self.assert_forbidden(res, "ACCOUNT_SUPERUSER_PROTECTED")

    def test_last_superuser_cannot_be_deactivated(self, superuser: User, login: Any) -> None:
        """Không thể khóa (deactivate) superuser cuối cùng trong hệ thống (422 ACCOUNT_LAST_SUPERUSER)."""
        res = login(superuser).patch(f"{URL}/{superuser.pk}", {"is_active": False}, format="json")
        self.assert_error(res, 422, "ACCOUNT_LAST_SUPERUSER")

    def test_last_superuser_cannot_be_demoted(self, superuser: User, login: Any) -> None:
        """Không thể tước quyền superuser cuối cùng (422 ACCOUNT_LAST_SUPERUSER)."""
        res = login(superuser).patch(f"{URL}/{superuser.pk}", {"is_superuser": False}, format="json")
        self.assert_error(res, 422, "ACCOUNT_LAST_SUPERUSER")

    def test_superuser_can_be_demoted_when_another_exists(self, superuser: User, login: Any) -> None:
        """Superuser có thể bị hạ quyền nếu vẫn còn ít nhất 1 superuser khác đang hoạt động."""
        other = UserFactory(is_superuser=True, is_staff=True)
        res = login(superuser).patch(f"{URL}/{other.pk}", {"is_superuser": False}, format="json")
        data = self.assert_success(res, 200)
        assert data["is_superuser"] is False

    def test_update_unauthenticated_rejected(self, user: User, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(f"{URL}/{user.pk}", {"first_name": "x"}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Người dùng thường thiếu quyền account.user.update bị 403."""
        other = UserFactory()
        api = login(user)
        res = api.patch(f"{URL}/{other.pk}", {"first_name": "x"}, format="json")
        self.assert_forbidden(res)
