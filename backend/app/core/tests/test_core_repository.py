"""Test CoreRepository: đọc (get_all, filter, find, count...), ghi (audit, savepoint, soft delete)."""

import pytest

from app.core.context.user_context import request_context, set_current_user
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.models.role import Role
from app.modules.iam.repositories.role_repository import RoleRepository

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


def test_soft_delete_hidden_from_repository() -> None:
    repo = RoleRepository()
    role = repo.create(code="GONE", name="x")
    repo.soft_delete(role)
    with pytest.raises(NotFoundError):
        RoleRepository().get_by_id(role.pk)


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


def test_update_where_sets_audit_and_delete_where() -> None:
    actor = UserFactory()
    repo = RoleRepository()
    repo.create(code="BULK_A", name="a")
    repo.create(code="BULK_B", name="b")
    assert repo.update_where({"name": "Đã đổi"}, actor=actor, code__startswith="BULK_") == 2
    assert all(role.updated_by_id == actor.pk for role in Role.objects.filter(code__startswith="BULK_"))
    assert repo.delete_where(code__startswith="BULK_") == 2
