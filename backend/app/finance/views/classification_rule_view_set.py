"""Quy tắc nhận diện (regex → nền tảng)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.finance.filters.classification_rule_filter import ClassificationRuleFilter
from app.finance.models.classification_rule import ClassificationRule
from app.finance.permissions.rule_permission import RulePermission as P
from app.finance.serializers.responses.classification_rule_response_serializer import (
    ClassificationRuleResponseSerializer,
)
from app.finance.serializers.validates.classification_rule_bulk_update_validate_serializer import (
    ClassificationRuleBulkUpdateValidateSerializer,
)
from app.finance.serializers.validates.classification_rule_update_validate_serializer import (
    ClassificationRuleUpdateValidateSerializer,
)
from app.finance.serializers.validates.classification_rule_validate_serializer import (
    ClassificationRuleValidateSerializer,
)
from app.finance.services.classification_rule_service import ClassificationRuleService
from app.system.types.permission_rule import permission_rule


class ClassificationRuleViewSet(CoreModelViewSet[ClassificationRule]):
    """Quy tắc nhận diện (regex → nền tảng)."""

    service_class = ClassificationRuleService
    filterset_class = ClassificationRuleFilter
    search_fields = ("name", "pattern")
    ordering = ("-priority", "created_at")
    ordering_fields = ("priority", "name", "created_at")
    list_serializer_class = ClassificationRuleResponseSerializer
    detail_serializer_class = ClassificationRuleResponseSerializer
    create_serializer_class = ClassificationRuleValidateSerializer
    update_serializer_class = ClassificationRuleUpdateValidateSerializer
    bulk_update_serializer_class = ClassificationRuleBulkUpdateValidateSerializer
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
