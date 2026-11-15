"""Test CoreRepository: đọc (get_all, filter, find, count...), ghi (audit, savepoint, soft delete)."""

import pytest

from app.core.context.user_context import request_context, set_current_user
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.repositories.core_repository import CoreRepository
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.models.role import Role
from app.modules.iam.repositories.role_repository import RoleRepository
from app.modules.journal.repositories.journal_entry_repository import JournalEntryRepository
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.services.short_link_service import ShortLinkService

pytestmark = pytest.mark.django_db


def test_create_and_update_audit() -> None:
    actor = UserFactory()
    repo = RoleRepository()
    role = repo.create(actor=actor, code="AUDIT", name="Audit")
    assert role.created_by_id == actor.pk and role.updated_by_id == actor.pk
    other = UserFactory()
    repo.update(role, actor=other, name="Đổi tên")
    role.refresh_from_db()
    assert role.name == "Đổi tên" and role.updated_by_id == other.pk


def test_audit_from_context() -> None:
    actor = UserFactory()
    with request_context("req-12345678"):
        set_current_user(actor)
        role = RoleRepository().create(code="CTX", name="Ctx")
    assert role.created_by_id == actor.pk


def test_integrity_error_becomes_conflict() -> None:
    repo = RoleRepository()
    repo.create(code="DUP", name="a")
    with pytest.raises(ConflictError):
        repo.create(code="DUP", name="b")
    # Transaction ngoài vẫn dùng được sau lỗi (savepoint).
    assert Role.objects.filter(code="DUP").count() == 1


def test_delete_is_soft_by_default() -> None:
    actor = UserFactory()
    repo = RoleRepository()
    role = repo.create(code="GONE", name="x")
    repo.delete(role, actor=actor)
    role.refresh_from_db()
    assert role.deleted_at is not None and role.deleted_by_id == actor.pk
    with pytest.raises(NotFoundError):
        RoleRepository().get_by_id(role.pk)
    assert repo.get_queryset_with_deleted().filter(pk=role.pk).exists()


class _PlainRoleRepository(CoreRepository[Role]):
    """Repository không ghi đè get_queryset: base phải tự ẩn bản đã xóa mềm."""

    model = Role


def test_base_queryset_hides_soft_deleted() -> None:
    repo = _PlainRoleRepository()
    role = repo.create(code="PLAIN", name="x")
    repo.delete(role)
    assert not repo.exists(code="PLAIN")
    assert repo.count(code="PLAIN") == 0
    with pytest.raises(NotFoundError):
        repo.get_for_update(role.pk)


def test_delete_requires_soft_delete_field() -> None:
    entry = JournalEntryRepository().insert(
        actor_id=None,
        actor_label="",
        request_id="",
        resource="iam.role",
        object_id="x",
        object_label="x",
        action="EVENT",
        event="test.event",
        changes={},
    )
    with pytest.raises(TypeError, match="hard_delete"):
        JournalEntryRepository().delete(entry)
    JournalEntryRepository().hard_delete(entry)


def test_bulk_create_sets_audit() -> None:
    actor = UserFactory()
    roles = RoleRepository().bulk_create([Role(code="B1", name="1"), Role(code="B2", name="2")], actor=actor)
    assert all(role.created_by_id == actor.pk for role in roles)


def test_read_helpers() -> None:
    repo = RoleRepository()
    first = repo.create(code="READ_A", name="A")
    second = repo.create(code="READ_B", name="B")
    codes = {role.code for role in repo.get_all()}
    assert {"READ_A", "READ_B"} <= codes
    assert repo.find_one(code="READ_A") == first
    assert repo.find_one(code="NOPE") is None
    assert repo.find_by_id("not-a-uuid") is None
    assert repo.get_by_id(second.pk) == second
    assert repo.count(code__startswith="READ_") == 2
    assert repo.exists(code="READ_B")
    assert repo.values_list("code", code__startswith="READ_") and repo.filter(code="READ_A").count() == 1
    with pytest.raises(NotFoundError):
        repo.get_by_id("00000000-0000-0000-0000-000000000000")


def test_update_where_sets_audit_and_delete_where_is_soft() -> None:
    actor = UserFactory()
    repo = RoleRepository()
    repo.create(code="BULK_A", name="a")
    repo.create(code="BULK_B", name="b")
    assert repo.update_where({"name": "Đã đổi"}, actor=actor, code__startswith="BULK_") == 2
    assert all(role.updated_by_id == actor.pk for role in Role.objects.filter(code__startswith="BULK_"))
    assert repo.delete_where(actor=actor, code__startswith="BULK_") == 2
    rows = Role.objects.filter(code__startswith="BULK_")
    assert rows.count() == 2 and all(role.deleted_by_id == actor.pk for role in rows)
    assert repo.delete_where(code__startswith="BULK_") == 0  # đã xóa thì không xóa lại
    assert repo.hard_delete_where(code__startswith="BULK_") == 2
    assert not Role.objects.filter(code__startswith="BULK_").exists()


def test_soft_delete_releases_unique_values() -> None:
    """Xóa mềm thêm `_deleted_<timestamp>` cho field unique: tạo lại cùng mã không bị chặn."""
    repo = RoleRepository()
    role = repo.create(code="REUSE", name="x")
    repo.delete(role)
    role.refresh_from_db()
    assert role.code.startswith("REUSE_deleted_")
    again = repo.create(code="REUSE", name="y")
    assert again.code == "REUSE"


def test_soft_delete_suffix_respects_max_length() -> None:
    owner = UserFactory()
    service = ShortLinkService()
    slug = "a" * 64
    link = service.create(owner, {"name": "Dài", "slug": slug, "destination_url": "https://example.com"})
    service.delete(owner, link.pk)
    stored = ShortLink.objects.get(pk=link.pk).slug
    assert len(stored) <= ShortLink._meta.get_field("slug").max_length
    assert "_deleted_" in stored
    assert service.create(owner, {"name": "Lại", "slug": slug, "destination_url": "https://example.com"})


def test_delete_where_releases_unique_values() -> None:
    repo = RoleRepository()
    repo.create(code="WHERE_A", name="a")
    assert repo.delete_where(code="WHERE_A") == 1
    assert Role.objects.get(code__startswith="WHERE_A_deleted_").deleted_at is not None
    assert repo.create(code="WHERE_A", name="b").code == "WHERE_A"
