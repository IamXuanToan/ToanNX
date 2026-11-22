"""Nền tảng của từng người."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.finance.filters.platform_filter import PlatformFilter
from app.finance.models.platform import Platform
from app.finance.permissions.platform_permission import PlatformPermission as P
from app.finance.serializers.responses.platform_response_serializer import PlatformResponseSerializer
from app.finance.serializers.validates.platform_bulk_update_validate_serializer import (
    PlatformBulkUpdateValidateSerializer,
)
from app.finance.serializers.validates.platform_update_validate_serializer import (
    PlatformUpdateValidateSerializer,
)
from app.finance.serializers.validates.platform_validate_serializer import PlatformValidateSerializer
from app.finance.services.platform_service import PlatformService
from app.system.types.permission_rule import permission_rule


class PlatformViewSet(CoreModelViewSet[Platform]):
    """Nền tảng của từng người."""

    service_class = PlatformService
    filterset_class = PlatformFilter
    search_fields = ("name", "code")
    ordering = ("name",)
    ordering_fields = ("name", "created_at")
    list_serializer_class = PlatformResponseSerializer
    detail_serializer_class = PlatformResponseSerializer
    create_serializer_class = PlatformValidateSerializer
    update_serializer_class = PlatformUpdateValidateSerializer
    bulk_update_serializer_class = PlatformBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
