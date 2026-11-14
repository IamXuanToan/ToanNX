"""Response POST /auth/login, POST /auth/refresh, GET /auth/me."""

from typing import Any

from rest_framework import serializers

from app.modules.account.serializers.responses.user_detail_response_serializer import (
    UserDetailResponseSerializer,
)
from app.modules.iam.serializers.responses.role_summary_response_serializer import (
    RoleSummaryResponseSerializer,
)
from app.modules.system.serializers.responses.module_list_response_serializer import (
    ModuleListResponseSerializer,
)


class CurrentUserResponseSerializer(serializers.Serializer[Any]):
    """Serialize `CurrentUserProfile` (service đã dựng sẵn dữ liệu)."""

    user = UserDetailResponseSerializer(help_text="Thông tin người dùng đang đăng nhập.")
    roles = RoleSummaryResponseSerializer(many=True, help_text="Vai trò đang gán cho người dùng.")
    permissions = serializers.ListField(
        child=serializers.CharField(), help_text="Mã quyền hiệu lực (superuser: FE coi là có mọi quyền)."
    )
    modules = ModuleListResponseSerializer(many=True, help_text="Module đang bật mà UI có thể hiển thị.")
