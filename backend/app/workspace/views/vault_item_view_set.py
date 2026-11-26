"""CRUD Két sắt Bí mật cá nhân (`/api/v1/workspace/vault-items` + `/reveal`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.vault_item_filter import VaultItemFilter
from app.workspace.models.vault_item import VaultItem
from app.workspace.permissions.vault_item_permission import VaultItemPermission as P
from app.workspace.serializers.responses.vault_item_response_serializer import (
    VaultItemResponseSerializer,
)
from app.workspace.serializers.responses.vault_item_reveal_response_serializer import (
    VaultItemRevealResponseSerializer,
)
from app.workspace.serializers.validates.vault_item_create_validate_serializer import (
    VaultItemCreateValidateSerializer,
)
from app.workspace.serializers.validates.vault_item_update_validate_serializer import (
    VaultItemUpdateValidateSerializer,
)
from app.workspace.services.vault_item_service import VaultItemService


class VaultItemViewSet(CoreModelViewSet[VaultItem]):
    """Quản lý bí mật đã mã hóa; danh sách luôn che bản rõ và chỉ giải mã qua POST `/reveal`."""

    service_class = VaultItemService
    filterset_class = VaultItemFilter
    search_fields = ("title", "username", "url", "notes")
    ordering_fields = ("title", "last_revealed_at", "created_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = VaultItemResponseSerializer
    detail_serializer_class = VaultItemResponseSerializer
    create_serializer_class = VaultItemCreateValidateSerializer
    update_serializer_class = VaultItemUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {
        "create": WorkspaceRateLimitKey.VAULT_CREATE,
        "reveal": WorkspaceRateLimitKey.VAULT_REVEAL,
    }
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
        "reveal": permission_rule(P.REVEAL),
    }

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service Két sắt cho action giải mã."""
        super().__init__(**kwargs)
        self.vault_service = VaultItemService()

    @extend_schema(request=None, responses=VaultItemRevealResponseSerializer)
    @action(detail=True, methods=["post"])
    def reveal(self, request: Request, pk: Any = None) -> CoreResponse:
        """Giải mã bí mật một lần kèm ghi nhận dấu vết mở xem."""
        data = self.vault_service.reveal(self.get_actor(request), pk)
        return CoreResponse(VaultItemRevealResponseSerializer(data).data)
