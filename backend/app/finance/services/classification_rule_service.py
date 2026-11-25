"""Quy tắc nhận diện của từng người: kiểm regex, nền tảng thuộc mình, thử nội dung."""

from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.classification_rule import ClassificationRule
from app.finance.permissions.rule_permission import RulePermission
from app.finance.repositories.classification_rule_repository import ClassificationRuleRepository
from app.finance.services.classification_engine import ClassificationEngine
from app.finance.services.platform_service import PlatformService
from app.finance.utils.content_normalizer import normalize_content


class ClassificationRuleService(CoreCrudService[ClassificationRule, ClassificationRuleRepository]):
    """Nhận diện chạy theo quy tắc của chủ giao dịch."""

    repository_class = ClassificationRuleRepository
    owner_field = "owner"
    manage_all_permission = RulePermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: ClassificationRuleRepository | None = None,
        platform_service: PlatformService | None = None,
        engine: ClassificationEngine | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or ClassificationRuleRepository())
        self.platform_service = platform_service or PlatformService()
        self.engine = engine or ClassificationEngine(self.repository)

    def create(self, actor: Any, data: dict[str, Any]) -> ClassificationRule:
        """Regex hợp lệ, nền tảng thuộc actor."""
        self._check(actor, data)
        return super().create(actor, data)

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> ClassificationRule:
        """Kiểm tra quyền/owner trước khi kiểm dữ liệu để trả 404 thay vì 422 với bản ghi người khác."""
        with transaction.atomic():
            self.get_for_write(actor, pk)
            self._check(actor, data)
            return super().update(actor, pk, data)

    def test(self, actor: Any, content: str, pattern: str | None) -> dict[str, Any]:
        """Thử một nội dung: với `pattern` thì chỉ so regex đó, không thì chạy mọi quy tắc của actor."""
        normalized = normalize_content(content)
        if pattern:
            self._check_pattern(pattern)
            return {
                "normalized": normalized,
                "rule": None,
                "matched_text": self.engine.search(pattern, normalized),
            }
        match = self.engine.match(actor.pk, content)
        return {
            "normalized": normalized,
            "rule": match.rule if match else None,
            "matched_text": match.matched_text if match else None,
        }

    def _check(self, actor: Any, data: dict[str, Any]) -> None:
        if "pattern" in data:
            self._check_pattern(data["pattern"])
        if data.get("platform_id"):
            self.platform_service.get_usable(actor, data["platform_id"])

    def _check_pattern(self, pattern: str) -> None:
        if not self.engine.is_valid(pattern):
            raise BusinessRuleError("Regex không hợp lệ.", code=FinanceErrorCode.RULE_PATTERN_INVALID)
