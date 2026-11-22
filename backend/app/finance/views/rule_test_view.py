"""POST /finance/rules/test: thử nội dung với một regex hoặc mọi quy tắc của mình."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.rule_permission import RulePermission
from app.finance.serializers.responses.rule_test_response_serializer import RuleTestResponseSerializer
from app.finance.serializers.validates.rule_test_validate_serializer import RuleTestValidateSerializer
from app.finance.services.classification_rule_service import ClassificationRuleService
from app.system.decorators.require_permission import require_permission


class RuleTestView(CoreApiView):
    """Chạy ở BE (thư viện `regex`, có timeout)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.classification_rule_service = ClassificationRuleService()

    @extend_schema(responses=RuleTestResponseSerializer)
    @require_permission(RulePermission.READ)
    @validate_request(RuleTestValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Kết quả thử."""
        result = self.classification_rule_service.test(
            self.get_actor(request), validated_data["content"], validated_data.get("pattern") or None
        )
        return CoreResponse(RuleTestResponseSerializer(result).data)
