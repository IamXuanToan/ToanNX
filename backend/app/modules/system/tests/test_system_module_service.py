"""Test SystemModuleService: installed ≠ enabled, phụ thuộc."""

from typing import Any

import pytest

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_group import ModuleGroup
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.modules.system.models.system_module import SystemModule
from app.modules.system.services.system_module_service import SystemModuleService

pytestmark = pytest.mark.django_db


@pytest.fixture
def registry() -> ModuleRegistry:
    """Registry riêng cho test: module lõi thật + hai module tùy chọn có phụ thuộc."""
    test_registry = ModuleRegistry()
    for descriptor in module_registry.all():
        test_registry.register(descriptor)
    test_registry.register(ModuleDescriptor("alpha", "Alpha", "", "1.0.0", ModuleGroup.SYSTEM))
    test_registry.register(
        ModuleDescriptor("beta", "Beta", "", "1.0.0", ModuleGroup.SYSTEM, dependencies=("alpha",))
    )
    return test_registry


class TestSystemModuleService:
    """Bật/tắt module."""

    def test_core_module_cannot_be_disabled(self, registry: ModuleRegistry, superuser: Any) -> None:
        with pytest.raises(BusinessRuleError) as exc:
            SystemModuleService(registry).set_enabled(superuser, "iam", False)
        assert exc.value.code == "MODULE_CORE_LOCKED"

    def test_not_installed_cannot_be_enabled_by_flag(self, registry: ModuleRegistry, superuser: Any) -> None:
        SystemModule.objects.create(code="ghost", enabled=True)
        service = SystemModuleService(registry)
        assert service.is_enabled("ghost") is False
        with pytest.raises(NotFoundError):
            service.set_enabled(superuser, "ghost", True)

    def test_dependencies(self, registry: ModuleRegistry, superuser: Any) -> None:
        service = SystemModuleService(registry)
        with pytest.raises(BusinessRuleError) as exc:
            service.set_enabled(superuser, "alpha", False)
        assert exc.value.code == "MODULE_REQUIRED_BY_OTHERS"
        service.set_enabled(superuser, "beta", False)
        service.set_enabled(superuser, "alpha", False)
        assert service.is_enabled("alpha") is False
        assert SystemModule.objects.get(code="alpha").updated_by_id == superuser.pk
        with pytest.raises(BusinessRuleError) as exc:
            service.set_enabled(superuser, "beta", True)
        assert exc.value.code == "MODULE_DEPENDENCY_DISABLED"
