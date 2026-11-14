"""Response từng phần tử của GET /system/modules (cũng dùng trong /auth/me)."""

from typing import Any

from rest_framework import serializers

from app.modules.system.types.module_state import ModuleState


class ModuleListResponseSerializer(serializers.Serializer[Any]):
    """Module đã cài kèm nhóm và trạng thái."""

    code = serializers.CharField(source="descriptor.code", help_text="Mã module.")
    name = serializers.CharField(source="descriptor.name", help_text="Tên module.")
    description = serializers.CharField(source="descriptor.description", help_text="Mô tả module.")
    version = serializers.CharField(source="descriptor.version", help_text="Phiên bản module.")
    group = serializers.CharField(source="descriptor.group", help_text="Nhóm module, ví dụ `system`.")
    is_core = serializers.BooleanField(source="descriptor.is_core", help_text="Module lõi, không thể tắt.")
    installed = serializers.SerializerMethodField(
        help_text="Module đã cài (luôn true với module trong registry)."
    )
    enabled = serializers.BooleanField(help_text="Module đang bật.")
    icon = serializers.CharField(
        help_text="Tên icon lucide-react (kebab-case) hiệu lực: cấu hình quản trị, nếu không có thì mặc định."
    )
    icon_url = serializers.URLField(
        allow_null=True,
        help_text="URL tuyệt đối của icon SVG tự upload (ưu tiên hơn `icon`), hoặc null.",
    )
    dependencies = serializers.ListField(
        source="descriptor.dependencies", child=serializers.CharField(), help_text="Mã các module phụ thuộc."
    )
    permissions = serializers.SerializerMethodField(help_text="Mã quyền module khai báo.")

    def get_installed(self, obj: ModuleState) -> bool:
        """Module trong registry luôn là đã cài.

        Args:
            obj: Trạng thái module.

        Returns:
            True.
        """
        return True

    def get_permissions(self, obj: ModuleState) -> list[str]:
        """Mã quyền module khai báo.

        Args:
            obj: Trạng thái module.

        Returns:
            Danh sách mã quyền.
        """
        return [permission.code for permission in obj.descriptor.permissions]
