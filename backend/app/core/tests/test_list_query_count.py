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
from app.modules.short_links.services.short_link_service import ShortLinkService

pytestmark = pytest.mark.django_db


def _short_links(owner: Any, count: int) -> None:
    service = ShortLinkService()
    for _ in range(count):
        slug = f"qc-{UserFactory.build().email.split('@')[0]}"
        service.create(owner, {"name": slug, "slug": slug, "destination_url": "https://example.com"})


CASES: list[tuple[str, Callable[[Any, int], None]]] = [
    ("/api/v1/account/users", lambda owner, n: UserFactory.create_batch(n)),
    ("/api/v1/iam/roles", lambda owner, n: RoleFactory.create_batch(n)),
    ("/api/v1/short_links/links", _short_links),
    ("/api/v1/journal/entries", lambda owner, n: RoleFactory.create_batch(n)),
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
