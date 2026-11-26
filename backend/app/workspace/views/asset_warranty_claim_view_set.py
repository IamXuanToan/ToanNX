"""CRUD Phiếu Bảo hành & Sửa chữa (`/api/v1/workspace/warranty-claims`)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.asset_warranty_claim_filter import AssetWarrantyClaimFilter
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.permissions.asset_warranty_claim_permission import (
    AssetWarrantyClaimPermission as P,
)
from app.workspace.serializers.responses.asset_warranty_claim_response_serializer import (
    AssetWarrantyClaimResponseSerializer,
)
from app.workspace.serializers.validates.asset_warranty_claim_create_validate_serializer import (
    AssetWarrantyClaimCreateValidateSerializer,
)
from app.workspace.serializers.validates.asset_warranty_claim_update_validate_serializer import (
    AssetWarrantyClaimUpdateValidateSerializer,
)
from app.workspace.services.asset_warranty_claim_service import AssetWarrantyClaimService


class AssetWarrantyClaimViewSet(CoreModelViewSet[AssetWarrantyClaim]):
    """Quản lý lịch sử gửi bảo hành/sửa chữa và đồng bộ trạng thái thiết bị."""

    service_class = AssetWarrantyClaimService
    filterset_class = AssetWarrantyClaimFilter
    search_fields = (
        "claim_code",
        "external_ticket_code",
        "service_center",
        "issue_description",
        "asset__name",
    )
    ordering_fields = (
        "submitted_date",
        "estimated_return_date",
        "returned_date",
        "cost_vnd",
        "created_at",
    )
    ordering = ("-submitted_date", "-created_at", "-pk")
    list_serializer_class = AssetWarrantyClaimResponseSerializer
    detail_serializer_class = AssetWarrantyClaimResponseSerializer
    create_serializer_class = AssetWarrantyClaimCreateValidateSerializer
    update_serializer_class = AssetWarrantyClaimUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": WorkspaceRateLimitKey.WARRANTY_CLAIM_CREATE}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
