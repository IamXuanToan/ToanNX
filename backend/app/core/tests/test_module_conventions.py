"""Quy ước module: CoreModuleConfig, mã module = label app, mọi view kế thừa view gốc của core."""

from typing import Any

import pytest
from django.apps import apps
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.permissions import AllowAny

from app.core.permissions.csrf_protected import CsrfProtected
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.registry.core_module_config import CoreModuleConfig
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.core.views.core_api_view import CoreApiView
from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.iam.decorators.require_permission import PERMISSION_RULE_ATTR
from app.modules.iam.permissions.has_iam_permission import HasIamPermission

MODULE_APP_PREFIX = "app.modules."


def _module_app_configs() -> list[Any]:
    return [config for config in apps.get_app_configs() if config.name.startswith(MODULE_APP_PREFIX)]


def _iter_view_classes(patterns: list[URLPattern | URLResolver]) -> list[type]:
    return [view_class for view_class, _ in _iter_views(patterns)]


def _iter_views(patterns: list[URLPattern | URLResolver]) -> list[tuple[type, dict[str, str]]]:
    """(lớp view, map method → action của router) cho mọi URL."""
    found: list[tuple[type, dict[str, str]]] = []
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            found += _iter_views(pattern.url_patterns)
            continue
        callback = pattern.callback
        view_class = getattr(callback, "cls", None) or getattr(callback, "view_class", None)
        if view_class is not None:
            found.append((view_class, dict(getattr(callback, "actions", None) or {})))
    return found


def _module_views() -> list[tuple[type, dict[str, str]]]:
    return [
        (view_class, actions)
        for view_class, actions in _iter_views(get_resolver().url_patterns)
        if view_class.__module__.startswith(MODULE_APP_PREFIX)
    ]


def _uses_iam(view_class: type) -> bool:
    """View dùng quyền mặc định (có HasIamPermission) — không ghi đè sang công khai/chỉ đăng nhập."""
    return HasIamPermission in list(view_class.permission_classes)  # type: ignore[attr-defined]


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

    def test_every_action_declares_permission(self) -> None:
        """Mặc định DENY: action/method nào mở ra cũng phải khai quyền IAM (hoặc view ghi đè tường minh)."""
        missing: list[str] = []
        for view_class, actions in _module_views():
            if not _uses_iam(view_class):
                continue
            if actions:
                rules = getattr(view_class, "action_permissions", {})
                missing += [
                    f"{view_class.__qualname__}.{action}"
                    for method, action in actions.items()
                    if method in view_class.http_method_names and method != "head" and action not in rules
                ]
            else:
                for method in ("get", "post", "patch", "put", "delete"):
                    handler = getattr(view_class, method, None)
                    if handler is not None and getattr(handler, PERMISSION_RULE_ATTR, None) is None:
                        missing.append(f"{view_class.__qualname__}.{method}")
        assert not missing, f"Chưa khai quyền: {sorted(set(missing))}"

    def test_permission_overrides_follow_standard(self) -> None:
        """View chỉ được ghi đè `permission_classes` theo bảng chuẩn của `CoreApiView`."""
        allowed = [
            [IsActiveAuthenticated, HasIamPermission],
            [IsActiveAuthenticated],
            [AllowAny],
            [AllowAny, CsrfProtected],
        ]
        wrong = [
            view_class.__qualname__
            for view_class, _ in _module_views()
            if list(view_class.permission_classes) not in allowed  # type: ignore[attr-defined]
        ]
        assert not wrong, f"permission_classes ngoài bảng chuẩn: {wrong}"
