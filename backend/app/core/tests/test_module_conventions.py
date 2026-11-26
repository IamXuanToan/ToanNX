"""Quy ước module: CoreModuleConfig, mã module = label app, mọi view kế thừa view gốc của core."""

import ast
from enum import StrEnum
from pathlib import Path
from typing import Any

import pytest
from django.apps import apps
from django.conf import settings
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.permissions import AllowAny

from app.core.constants.module_code import ModuleCode
from app.core.decorators.rate_limit import RATE_LIMIT_ATTR
from app.core.permissions.csrf_protected import CsrfProtected
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.registry.core_module_config import CoreModuleConfig
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.core.services.core_crud_service import CoreCrudService
from app.core.views.core_api_view import CoreApiView
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.decorators.require_permission import PERMISSION_RULE_ATTR
from app.system.permissions.has_iam_permission import HasIamPermission

MODULE_APP_PREFIX = "app."


def _module_app_configs() -> list[Any]:
    return [
        config
        for config in apps.get_app_configs()
        if config.name.startswith(MODULE_APP_PREFIX) and config.name != "app.core"
    ]


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
        and not view_class.__module__.startswith("app.core")
    ]


def _subclasses(base: type) -> list[type]:
    """Mọi lớp con (đệ quy) của `base`."""
    found: list[type] = []
    for sub in base.__subclasses__():
        found += [sub, *_subclasses(sub)]
    return found


def _uses_iam(view_class: type) -> bool:
    """View dùng quyền mặc định (có HasIamPermission) — không ghi đè sang công khai/chỉ đăng nhập."""
    return HasIamPermission in list(view_class.permission_classes)  # type: ignore[attr-defined]


class TestModuleConventions:
    """Mỗi module khai mã module đúng một lần (module.py) và dùng view gốc của core."""

    def test_every_module_app_uses_core_module_config(self) -> None:
        configs = _module_app_configs()
        assert configs, "Không tìm thấy app nào trong app"
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
            and not view_class.__module__.startswith("app.core")
            and not view_class.__module__.startswith("app.core")
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

    def test_rate_limit_keys_exist(self) -> None:
        """Khóa `action_rate_limits` / `@rate_limit` phải là StrEnum và khai trong `settings.RATE_LIMITS`."""
        missing: list[str] = []
        raw_views: list[str] = []
        for view_class, _ in _module_views():
            declared = getattr(view_class, "action_rate_limits", {})
            for action, key in declared.items():
                if not isinstance(key, StrEnum):
                    raw_views.append(f"{view_class.__qualname__}.{action}: {key!r}")
                if key not in settings.RATE_LIMITS:
                    missing.append(f"{view_class.__qualname__}.{action}: {key}")
            for method in ("get", "post", "patch", "put", "delete"):
                key = getattr(getattr(view_class, method, None), RATE_LIMIT_ATTR, None)
                if key is not None:
                    if not isinstance(key, StrEnum):
                        raw_views.append(f"{view_class.__qualname__}.{method}: {key!r}")
                    if key not in settings.RATE_LIMITS:
                        missing.append(f"{view_class.__qualname__}.{method}: {key}")
        raw_settings = [repr(key) for key in settings.RATE_LIMITS if not isinstance(key, StrEnum)]
        assert not raw_views, (
            f"Rate limit trong view dùng chuỗi thô thay vì StrEnum: {sorted(set(raw_views))}"
        )
        assert not raw_settings, f"settings.RATE_LIMITS dùng chuỗi thô thay vì StrEnum: {raw_settings}"
        assert not missing, f"Khóa rate limit chưa khai trong RATE_LIMITS: {sorted(set(missing))}"

    def test_rate_limit_constants_split_segments(self) -> None:
        """Lớp `*RateLimitKey` phải ghép từ hằng module/nhóm/action, không viết chuỗi gộp dấu chấm."""
        app_root = Path(__file__).resolve().parents[2]
        offenders: list[str] = []
        for path in sorted(app_root.rglob("*_rate_limit_key.py")):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            for node in tree.body:
                if not isinstance(node, ast.ClassDef):
                    continue
                for stmt in node.body:
                    if not isinstance(stmt, ast.Assign):
                        continue
                    if (
                        isinstance(stmt.value, ast.Constant)
                        and isinstance(stmt.value.value, str)
                        and "." in stmt.value.value
                    ):
                        rel = path.relative_to(app_root).as_posix()
                        offenders.append(f"{rel}:{stmt.lineno} ({stmt.value.value!r})")
        assert not offenders, "Khóa rate limit viết gộp dấu chấm nguyên chuỗi:\n" + "\n".join(offenders)
        registered_labels = {config.label for config in _module_app_configs()}
        assert set(ModuleCode) == registered_labels

    def test_rate_limit_actions_exist(self) -> None:
        """Tên action trong `action_rate_limits` phải là action thật của ViewSet (gõ sai = không giới hạn)."""
        actions_by_view: dict[type, set[str]] = {}
        for view_class, actions in _module_views():
            actions_by_view.setdefault(view_class, set()).update(actions.values())
        unknown = [
            f"{view_class.__qualname__}.{name}"
            for view_class, actions in actions_by_view.items()
            for name in getattr(view_class, "action_rate_limits", {})
            if actions and name not in actions
        ]
        assert not unknown, f"action_rate_limits khai action không tồn tại: {unknown}"

    def test_crud_service_declarations_are_valid(self) -> None:
        """Setting quota tồn tại; tài nguyên có owner khai quyền xem tất cả."""
        wrong: list[str] = []
        for service in _subclasses(CoreCrudService):
            if service.owner_quota_setting and not hasattr(settings, service.owner_quota_setting):
                wrong.append(f"{service.__qualname__}: thiếu setting {service.owner_quota_setting}")
            if service.owner_field and not service.manage_all_permission:
                wrong.append(f"{service.__qualname__}: có owner_field nhưng thiếu manage_all_permission")
        assert not wrong, wrong
