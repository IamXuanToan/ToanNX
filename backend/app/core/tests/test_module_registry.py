"""Test ModuleRegistry: descriptor phải đúng quy ước."""

import pytest

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry
from app.core.registry.notification_event_definition import NotificationEventDefinition
from app.core.registry.permission_definition import PermissionDefinition


def test_rejects_permission_of_other_module() -> None:
    bad = ModuleDescriptor(
        "links",
        "Links",
        "",
        "1.0.0",
        permissions=(PermissionDefinition("system.user.read", "x", "y"),),
    )
    with pytest.raises(ValueError, match="phải thuộc module"):
        ModuleRegistry().register(bad)


def test_rejects_invalid_code() -> None:
    with pytest.raises(ValueError):
        ModuleRegistry().register(ModuleDescriptor("Bad-Code", "x", "", "1"))


def test_rejects_notification_event_of_other_module() -> None:
    bad = ModuleDescriptor(
        "links",
        "Links",
        "",
        "1.0.0",
        notification_events=(NotificationEventDefinition("system.user.created", "x", "y"),),
    )
    with pytest.raises(ValueError, match="phải thuộc module"):
        ModuleRegistry().register(bad)


def test_rejects_invalid_notification_event_code() -> None:
    bad = ModuleDescriptor(
        "links",
        "Links",
        "",
        "1.0.0",
        notification_events=(NotificationEventDefinition("links.created", "x", "y"),),
    )
    with pytest.raises(ValueError, match="Mã sự kiện"):
        ModuleRegistry().register(bad)


def test_finds_registered_notification_event() -> None:
    event = NotificationEventDefinition("links.link.created", "Tạo link", "Khi tạo link")
    registry = ModuleRegistry()
    registry.register(ModuleDescriptor("links", "Links", "", "1.0.0", notification_events=(event,)))
    assert registry.find_notification_event("links.link.created") == event
    assert registry.find_notification_event("links.link.deleted") is None


_READ = PermissionDefinition("links.link.read", "Xem", "Xem liên kết.")
_MANAGE_ALL = PermissionDefinition("links.link.manage_all", "Mọi người", "Mở phạm vi.")
_OTHER = PermissionDefinition("links.other.read", "Khác", "Không nằm trong permissions.")


def _links(member_permissions: tuple[PermissionDefinition, ...] = ()) -> ModuleDescriptor:
    """Module mẫu có quyền đọc + `manage_all`, chỉ khác nhau ở quyền thành viên."""
    return ModuleDescriptor(
        "links",
        "Links",
        "",
        "1.0.0",
        permissions=(_READ, _MANAGE_ALL),
        member_permissions=member_permissions,
    )


def test_requires_member_permissions_when_module_has_permissions() -> None:
    with pytest.raises(ValueError, match="phải khai member_permissions"):
        ModuleRegistry().register(_links())


def test_rejects_member_permission_outside_module_permissions() -> None:
    with pytest.raises(ValueError, match="không nằm trong permissions"):
        ModuleRegistry().register(_links(member_permissions=(_OTHER,)))


def test_rejects_scope_widening_member_permission() -> None:
    with pytest.raises(ValueError, match="mở rộng phạm vi"):
        ModuleRegistry().register(_links(member_permissions=(_READ, _MANAGE_ALL)))


def test_accepts_member_permissions_from_catalog() -> None:
    ModuleRegistry().register(_links(member_permissions=(_READ,)))
