"""Kiểm thử endpoint cập nhật hàng loạt quy tắc phân loại: POST /api/v1/finance/rules/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.finance.models.classification_rule import ClassificationRule
from app.finance.permissions.rule_permission import RulePermission as P
from app.finance.tests.helpers.finance_test_helper import make_platform
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/finance/rules/bulk-update"


def _make(owner: Any, n: int) -> ClassificationRule:
    """Tạo quy tắc phân loại thứ `n` (tài nguyên dùng chung thì bỏ qua `owner`)."""
    platform = make_platform(owner, f"rule-{n}-{owner.pk.hex[:6]}", f"Nền tảng {n}")
    return ClassificationRule.objects.create(
        owner=owner, name=f"Quy tắc {n}", platform=platform, pattern=f"MA{n}"
    )


class TestClassificationRuleBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/finance/rules/bulk-update."""

    def test_bulk_update_success(self, user: Any, login: Any) -> None:
        """Đổi cờ `is_active` của cả lô."""
        grant(user, P.UPDATE)
        items = [_make(user, 1), _make(user, 2)]
        api = login(user)

        payload = {"ids": [str(item.pk) for item in items], "is_active": False}
        data = self.assert_success(api.post(URL, payload, format="json"), 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.is_active is False

    def test_bulk_update_validation_errors(self, user: Any, login: Any) -> None:
        """Thiếu `ids` và cờ bị 400 VALIDATION_ERROR."""
        grant(user, P.UPDATE)
        api = login(user)

        error = self.assert_error(api.post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"] and "is_active" in error["details"]

    def test_bulk_update_owner_isolation(self, user: Any, login: Any) -> None:
        """Lô có bản ghi của người khác → 404 và không bản ghi nào đổi."""
        grant(user, P.UPDATE)
        own = _make(user, 1)
        other = _make(UserFactory(), 2)
        api = login(user)

        payload = {"ids": [str(own.pk), str(other.pk)], "is_active": False}
        self.assert_error(api.post(URL, payload, format="json"), 404, "NOT_FOUND")
        own.refresh_from_db()
        assert own.is_active is True

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": [], "is_active": False}, format="json"))

    def test_bulk_update_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền sửa bị 403."""
        self.assert_forbidden(login(user).post(URL, {"ids": [], "is_active": False}, format="json"))
