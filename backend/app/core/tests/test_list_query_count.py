"""Chặn N+1: số query của danh sách không tăng theo số bản ghi.

Module mới thêm endpoint danh sách thì thêm một dòng vào `CASES`.
"""

from collections.abc import Callable
from typing import Any

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.factories.role_factory import RoleFactory
from app.modules.custom_pages.models.page_path import PagePath
from app.modules.custom_pages.services.page_service import PageService
from app.modules.qr_codes.services.qr_code_service import QrCodeService
from app.modules.short_links.services.short_link_service import ShortLinkService

pytestmark = pytest.mark.django_db


def _short_links(owner: Any, count: int) -> None:
    service = ShortLinkService()
    for _ in range(count):
        slug = f"qc-{UserFactory.build().email.split('@')[0]}"
        service.create(owner, {"name": slug, "slug": slug, "destination_url": "https://example.com"})


def _pages(owner: Any, count: int) -> None:
    service, path = PageService(), PagePath.objects.get(segment="p")
    for _ in range(count):
        service.create(owner, {"path_id": path.pk, "title": "Trang"})


def _qr_codes(owner: Any, count: int) -> None:
    service = QrCodeService()
    design = {
        "size": 128,
        "foreground": "#000000",
        "background": "#FFFFFF",
        "margin": 1,
        "error_correction": "L",
    }
    for index in range(count):
        service.create(
            owner, {"name": f"QR {index}", "qr_type": "TEXT", "content": {"text": "x"}, "design": design}
        )


CASES: list[tuple[str, Callable[[Any, int], None]]] = [
    ("/api/v1/account/users", lambda owner, n: UserFactory.create_batch(n)),
    ("/api/v1/iam/roles", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/short_links/links", _short_links),
    ("/api/v1/journal/entries", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/custom_pages/pages", _pages),
    ("/api/v1/custom_pages/paths", lambda owner, n: None),
    ("/api/v1/qr_codes/codes", _qr_codes),
]


def _count(api: Any, url: str) -> int:
    with CaptureQueriesContext(connection) as context:
        response = api.get(url, {"page_size": 100})
    assert response.status_code == 200, response.content
    return len(context.captured_queries)


@pytest.mark.parametrize(("url", "make"), CASES)
def test_list_query_count_is_stable(
    url: str, make: Callable[[Any, int], None], superuser: Any, login: Any
) -> None:
    api = login(superuser)
    make(superuser, 1)
    first = _count(api, url)
    make(superuser, 20)
    assert _count(api, url) == first, f"{url}: số query tăng theo số bản ghi (N+1)"
