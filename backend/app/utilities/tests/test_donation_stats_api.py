"""Kiểm thử endpoint thống kê quyên góp: GET /api/v1/utilities/donations/stats."""

from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.utilities.permissions.donation_permission import DonationPermission
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/donations/stats"


class TestDonationStatsApi(BaseApiTestCase):
    """Kiểm thử phân quyền, cách ly owner và validate đầu vào endpoint thống kê quyên góp."""

    def test_unauthenticated_returns_401(self, client: Any) -> None:
        assert client.get(URL).status_code == 401

    def test_forbidden_without_read_permission(self, user: Any, login: Any) -> None:
        assert login(user).get(URL).status_code == 403

    def test_owner_isolation_blocks_reading_others_stats(self, login: Any) -> None:
        """Truyền ?owner=<victim> khi không có MANAGE_ALL chỉ trả tổng 0 của chính mình."""
        owner = UserFactory()
        victim = UserFactory()
        grant(owner, DonationPermission.READ)
        path = get_seeded_path("p")
        victim_page = Page.objects.create(owner=victim, path=path, title="Victim", slug="victim-stat")
        DonationTransaction.objects.create(
            page=victim_page,
            owner=victim,
            donor_title="Fan",
            amount=500000,
            received_at=timezone.now(),
            sepay_id="STAT-VICTIM-1",
        )

        res = login(owner).get(URL, {"owner": str(victim.pk)})
        data = self.assert_success(res)
        assert data["total_amount"] == 0
        assert data["total_count"] == 0

    def test_invalid_uuid_and_date_return_400_instead_of_500(self, user: Any, login: Any) -> None:
        """Tham số owner/page_id không phải UUID hoặc date_from sai định dạng trả 400 VALIDATION_ERROR."""
        grant(user, DonationPermission.READ)
        api = login(user)
        self.assert_error(api.get(URL, {"owner": "not-a-uuid"}), 400, "VALIDATION_ERROR")
        self.assert_error(api.get(URL, {"page_id": "bad-uuid"}), 400, "VALIDATION_ERROR")
        self.assert_error(api.get(URL, {"date_from": "not-a-date"}), 400, "VALIDATION_ERROR")
