"""Permission kiểm tra trạng thái module, gắn tự động vào mọi view kế thừa core.

Core không import module cụ thể: danh sách class lấy từ setting `MODULE_PERMISSION_CLASSES`
(giống cách Django cấu hình `AUTHENTICATION_BACKENDS`). Mặc định là `ModuleEnabled` của module
system, chặn API của module đang tắt.
"""

from functools import cache
from typing import Any

from django.conf import settings
from django.utils.module_loading import import_string
from rest_framework.permissions import BasePermission


@cache
def get_module_permission_classes() -> tuple[type[BasePermission], ...]:
    """Class permission khai báo trong `settings.MODULE_PERMISSION_CLASSES` (nạp một lần).

    Returns:
        Tuple class permission.
    """
    return tuple(import_string(path) for path in getattr(settings, "MODULE_PERMISSION_CLASSES", ()))


def build_module_permissions() -> list[Any]:
    """Instance permission kiểm tra module cho một request.

    Returns:
        Danh sách instance.
    """
    return [permission_class() for permission_class in get_module_permission_classes()]
