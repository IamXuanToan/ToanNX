"""CRUD Thiết bị cá nhân (`/api/v1/workspace/assets`)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.asset_filter import AssetFilter
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission as P
from app.workspace.serializers.responses.asset_response_serializer import AssetResponseSerializer
from app.workspace.serializers.validates.asset_create_validate_serializer import (
    AssetCreateValidateSerializer,
)
from app.workspace.serializers.validates.asset_update_validate_serializer import (
    AssetUpdateValidateSerializer,
)
from app.workspace.services.asset_service import AssetService


class AssetViewSet(CoreModelViewSet[Asset]):
    """Quản lý thiết bị, nơi mua lịch sử và hạn bảo hành theo phạm vi owner."""

    service_class = AssetService
    filterset_class = AssetFilter
    search_fields = (
        "name",
        "brand",
        "model_code",
        "serial_number",
        "imei",
        "purchase_store",
        "purchase_order_code",
    )
    ordering_fields = ("purchase_date", "warranty_end_date", "purchase_price_vnd", "created_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = AssetResponseSerializer
    detail_serializer_class = AssetResponseSerializer
    create_serializer_class = AssetCreateValidateSerializer
    update_serializer_class = AssetUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": WorkspaceRateLimitKey.ASSET_CREATE}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
