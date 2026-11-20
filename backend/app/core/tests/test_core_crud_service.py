"""Hành vi mặc định của `CoreCrudService`: owner, manage_all, quota, xóa mềm, bulk."""

from typing import Any

import pytest

from app.account.tests.factories.user_factory import UserFactory
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.iam.services.role_service import RoleService
from app.iam.tests.helpers.permission_helper import grant
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission as P
from app.utilities.services.short_link_service import ShortLinkService

pytestmark = pytest.mark.django_db


def _link(service: ShortLinkService, actor: Any, slug: str) -> ShortLink:
    return service.create(actor, {"name": slug, "slug": slug, "destination_url": "https://example.com"})


def test_owner_is_actor_and_scope_is_private() -> None:
    service = ShortLinkService()
    owner, other = UserFactory(), UserFactory()
    link = _link(service, owner, "owner-link")
    assert link.owner_id == owner.pk
    assert list(service.get_queryset_for(other)) == []
    with pytest.raises(NotFoundError):
        service.get_by_id_for(other, link.pk)
    with pytest.raises(NotFoundError):
        service.update(other, link.pk, {"name": "hack"})


def test_manage_all_sees_every_owner() -> None:
    service = ShortLinkService()
    owner, admin = UserFactory(), UserFactory()
    grant(admin, P.MANAGE_ALL)
    link = _link(service, owner, "any-link")
    assert service.get_by_id_for(admin, link.pk) == link
    assert link in service.get_queryset_for(admin)


def test_soft_deleted_record_cannot_be_written() -> None:
    service = ShortLinkService()
    owner = UserFactory()
    link = _link(service, owner, "gone-link")
    service.delete(owner, link.pk)
    with pytest.raises(NotFoundError):
        service.update(owner, link.pk, {"name": "again"})
    with pytest.raises(NotFoundError):
        service.delete(owner, link.pk)


def test_quota_per_owner(settings: Any) -> None:
    settings.SHORT_LINK_MAX_PER_OWNER = 1
    service = ShortLinkService()
    owner = UserFactory()
    _link(service, owner, "first-link")
    with pytest.raises(ConflictError) as error:
        _link(service, owner, "second-link")
    assert error.value.code == "QUOTA_EXCEEDED"
    _link(service, UserFactory(), "other-owner")


def test_bulk_is_all_or_nothing() -> None:
    service = ShortLinkService()
    owner, other = UserFactory(), UserFactory()
    mine = _link(service, owner, "mine-link")
    theirs = _link(service, other, "their-link")
    with pytest.raises(NotFoundError):
        service.bulk_delete(owner, [mine.pk, theirs.pk])
    assert ShortLink.objects.alive().filter(pk__in=[mine.pk, theirs.pk]).count() == 2
    assert service.bulk_update(owner, [mine.pk], {"name": "Đổi"}) == 1
    assert ShortLink.objects.get(pk=mine.pk).name == "Đổi"


def test_shared_resource_has_no_owner_filter() -> None:
    service = RoleService()
    actor = UserFactory()
    assert service.can_manage_all(actor)
    assert service.get_queryset_for(actor).count() == service.get_queryset().count()
