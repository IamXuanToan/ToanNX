"""Kiểm thử endpoint xuất CSV quyên góp: GET /api/v1/utilities/donations/export."""

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
URL = "/api/v1/utilities/donations/export"


class TestDonationExportApi(BaseApiTestCase):
    """Kiểm thử phân quyền, cách ly owner và trung hòa CSV Formula Injection khi xuất quyên góp."""

    def test_unauthenticated_returns_401(self, client: Any) -> None:
        assert client.get(URL).status_code == 401

    def test_forbidden_without_export_permission(self, user: Any, login: Any) -> None:
        grant(user, DonationPermission.READ)
        assert login(user).get(URL).status_code == 403

    def test_export_csv_sanitizes_formulas_and_isolates_owner(self, login: Any) -> None:
        owner = UserFactory()
        other = UserFactory()
        grant(owner, DonationPermission.EXPORT)
        grant(other, DonationPermission.EXPORT)
        path = get_seeded_path("p")

        own_page = Page.objects.create(
            owner=owner, path=path, title='=HYPERLINK("http://evil")', slug="own-exp"
        )
        other_page = Page.objects.create(owner=other, path=path, title="Trang Khac", slug="other-exp")

        DonationTransaction.objects.create(
            page=own_page,
            owner=owner,
            donor_title="+Donor",
            amount=50000,
            message="=1+1",
            original_content="\t=cmd|'/C calc'!A0",
            received_at=timezone.now(),
            sepay_id="EXP-OWN-1",
        )
        DonationTransaction.objects.create(
            page=other_page,
            owner=other,
            donor_title="OTHER_DONOR",
            amount=90000,
            message="OTHER_SECRET_MSG",
            received_at=timezone.now(),
            sepay_id="EXP-OTHER-1",
        )

        res = login(owner).get(URL)
        assert res.status_code == 200
        csv_text = res.content.decode("utf-8-sig")

        assert "'=HYPERLINK" in csv_text
        assert "'+Donor" in csv_text
        assert "'=1+1" in csv_text
        assert "'\t=cmd|'/C calc'!A0" in csv_text
        assert "OTHER_SECRET_MSG" not in csv_text
