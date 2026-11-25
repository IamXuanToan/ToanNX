"""Kiểm thử endpoint danh sách quyên góp: GET /api/v1/utilities/donations."""

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
URL = "/api/v1/utilities/donations"


class TestDonationListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/utilities/donations."""

    def test_list_success_paginated_with_page_and_owner(self, user: Any, login: Any) -> None:
        """Lấy danh sách quyên góp có phân trang `page=1&page_size=20&owner=<id>` không bị lỗi UUID."""
        grant(user, DonationPermission.READ)
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang Donate", slug="donate")

        for i in range(3):
            DonationTransaction.objects.create(
                page=page,
                owner=user,
                donor_title=f"Người ủng hộ {i}",
                amount=50000,
                received_at=timezone.now(),
                sepay_id=f"SEP{i}",
            )

        api = login(user)
        # Kiểm tra đúng URL mà client gửi kèm page=1 và owner
        res = api.get(URL, {"page": 1, "page_size": 20, "owner": str(user.pk)})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 3
        assert pagination["total"] == 3
        assert pagination["page"] == 1
        assert pagination["page_size"] == 20

    def test_list_filter_by_page_id(self, user: Any, login: Any) -> None:
        """Lọc danh sách theo `page_id`."""
        grant(user, DonationPermission.READ)
        path = get_seeded_path("p")
        p1 = Page.objects.create(owner=user, path=path, title="Page 1", slug="page-1")
        p2 = Page.objects.create(owner=user, path=path, title="Page 2", slug="page-2")

        d1 = DonationTransaction.objects.create(
            page=p1,
            owner=user,
            donor_title="Supporter 1",
            amount=50000,
            received_at=timezone.now(),
            sepay_id="SEP101",
        )
        DonationTransaction.objects.create(
            page=p2,
            owner=user,
            donor_title="Supporter 2",
            amount=100000,
            received_at=timezone.now(),
            sepay_id="SEP102",
        )

        api = login(user)
        res = api.get(URL, {"page_id": str(p1.pk), "page": 1})
        items, pagination = self.assert_paginated(res)

        assert len(items) == 1
        assert items[0]["id"] == str(d1.pk)
        assert pagination["total"] == 1

    def test_list_unauthenticated(self, client: Any) -> None:
        """Chưa đăng nhập trả về 401."""
        res = client.get(URL, {"page": 1})
        assert res.status_code == 401

    def test_list_forbidden(self, user: Any, login: Any) -> None:
        """Thiếu quyền READ trả về 403."""
        api = login(user)
        res = api.get(URL, {"page": 1})
        assert res.status_code == 403

    def test_list_owner_isolation(self, user: Any, login: Any) -> None:
        """Người dùng thường chỉ thấy giao dịch của mình; manage_all thấy tất cả."""
        other_user = UserFactory()
        path = get_seeded_path("p")
        p1 = Page.objects.create(owner=user, path=path, title="Trang User", slug="page-user")
        p2 = Page.objects.create(owner=other_user, path=path, title="Trang Other", slug="page-other")

        DonationTransaction.objects.create(
            page=p1,
            owner=user,
            donor_title="Donor của tôi",
            amount=50000,
            received_at=timezone.now(),
            sepay_id="SEP201",
        )
        DonationTransaction.objects.create(
            page=p2,
            owner=other_user,
            donor_title="Donor người khác",
            amount=100000,
            received_at=timezone.now(),
            sepay_id="SEP202",
        )

        grant(user, DonationPermission.READ)
        api = login(user)
        items, pagination = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination["total"] == 1
        assert items[0]["donor_title"] == "Donor của tôi"

        # Với quyền MANAGE_ALL
        grant(user, DonationPermission.MANAGE_ALL)
        items_all, pagination_all = self.assert_paginated(api.get(URL, {"page": 1}))
        assert pagination_all["total"] == 2

    def test_bulk_update_and_bulk_delete(self, user: Any, login: Any) -> None:
        """Cập nhật ẩn/hiện hàng loạt và xóa hàng loạt quyên góp."""
        grant(user, DonationPermission.READ, DonationPermission.UPDATE)
        path = get_seeded_path("p")
        page = Page.objects.create(owner=user, path=path, title="Trang User", slug="page-bulk")

        d1 = DonationTransaction.objects.create(
            page=page,
            owner=user,
            donor_title="Donor 1",
            amount=50000,
            received_at=timezone.now(),
            sepay_id="BULK01",
            is_hidden=False,
        )
        d2 = DonationTransaction.objects.create(
            page=page,
            owner=user,
            donor_title="Donor 2",
            amount=100000,
            received_at=timezone.now(),
            sepay_id="BULK02",
            is_hidden=False,
        )

        api = login(user)

        # 1. Bulk update: ẩn cả 2 lượt
        res_update = api.post(
            f"{URL}/bulk-update",
            {"ids": [str(d1.pk), str(d2.pk)], "is_hidden": True},
            format="json",
        )
        data_update = self.assert_success(res_update, 200)
        assert data_update["count"] == 2
        d1.refresh_from_db()
        d2.refresh_from_db()
        assert d1.is_hidden is True
        assert d2.is_hidden is True

        # 2. Bulk delete: xóa cả 2 lượt
        res_del = api.post(
            f"{URL}/bulk-delete",
            {"ids": [str(d1.pk), str(d2.pk)]},
            format="json",
        )
        data_del = self.assert_success(res_del, 200)
        assert data_del["count"] == 2
        d1.refresh_from_db()
        d2.refresh_from_db()
        assert d1.deleted_at is not None
        assert d2.deleted_at is not None
