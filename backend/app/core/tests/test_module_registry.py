"""Test ModuleRegistry: descriptor phải đúng quy ước."""

import pytest

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry
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
