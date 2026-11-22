"""Cùng lúc tạo một slug trên hai kết nối PostgreSQL."""

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from django.db import IntegrityError, connections

from app.system.tests.factories.user_factory import UserFactory
from app.utilities.models.short_link import ShortLink


@pytest.mark.django_db(transaction=True, serialized_rollback=True)
def test_concurrent_slug_creation_has_one_winner() -> None:
    """Unique index của DB từ chối một trong hai lệnh tạo đồng thời."""
    owner = UserFactory()
    barrier = Barrier(2)

    def create(index: int) -> bool:
        """Dùng kết nối DB riêng của thread và thử cùng slug."""
        try:
            barrier.wait(timeout=5)
            ShortLink.objects.create(
                owner_id=owner.pk,
                name=f"Link {index}",
                slug="race-link",
                destination_url="https://example.com",
            )
            return True
        except IntegrityError:
            return False
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(create, (1, 2)))
    assert sorted(outcomes) == [False, True]
    assert ShortLink.objects.filter(slug="race-link").count() == 1
