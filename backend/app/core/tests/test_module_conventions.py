"""Quy ước module: CoreModuleConfig, mã module = label app, mọi view kế thừa view gốc của core."""

from typing import Any

import pytest
from django.apps import apps
from django.urls import URLPattern, URLResolver, get_resolver

from app.core.registry.core_module_config import CoreModuleConfig
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.core.views.core_api_view import CoreApiView
from app.core.views.core_model_view_set import CoreModelViewSet

MODULE_APP_PREFIX = "app.modules."


def _module_app_configs() -> list[Any]:
    return [config for config in apps.get_app_configs() if config.name.startswith(MODULE_APP_PREFIX)]


def _iter_view_classes(patterns: list[URLPattern | URLResolver]) -> list[type]:
    found: list[type] = []
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            found += _iter_view_classes(pattern.url_patterns)
            continue
        callback = pattern.callback
        view_class = getattr(callback, "cls", None) or getattr(callback, "view_class", None)
        if view_class is not None:
            found.append(view_class)
    return found


class TestModuleConventions:
    """Mỗi module khai mã module đúng một lần (module.py) và dùng view gốc của core."""

    def test_every_module_app_uses_core_module_config(self) -> None:
        configs = _module_app_configs()
        assert configs, "Không tìm thấy app nào trong app/modules"
        for config in configs:
            assert isinstance(config, CoreModuleConfig), f"{config.name} phải kế thừa CoreModuleConfig"
            descriptor = module_registry.get(config.label)
            assert descriptor is not None, f"{config.name} chưa đăng ký MODULE"
            assert descriptor.code == config.label

    def test_registry_rejects_code_different_from_app_label(self) -> None:
        descriptor = ModuleDescriptor(code="alpha", name="A", description="", version="1")
        with pytest.raises(ValueError, match="label"):
            ModuleRegistry().register(descriptor, app_label="beta")

    def test_every_module_view_extends_core_view(self) -> None:
        view_classes = [
            view_class
            for view_class in _iter_view_classes(get_resolver().url_patterns)
            if view_class.__module__.startswith(MODULE_APP_PREFIX)
        ]
        assert view_classes
        for view_class in view_classes:
            assert issubclass(view_class, (CoreApiView, CoreModelViewSet)), (
                f"{view_class.__qualname__} phải kế thừa CoreApiView/CoreModelViewSet"
            )
