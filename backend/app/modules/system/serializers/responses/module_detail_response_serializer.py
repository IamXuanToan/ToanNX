"""Response PATCH /system/modules/{code}."""

from app.modules.system.serializers.responses.module_list_response_serializer import (
    ModuleListResponseSerializer,
)


class ModuleDetailResponseSerializer(ModuleListResponseSerializer):
    """Trạng thái module sau khi cập nhật (cùng cấu trúc với phần tử danh sách)."""
