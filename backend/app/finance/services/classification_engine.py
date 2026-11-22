"""So nội dung chuyển khoản với quy tắc regex của một người (thuần đọc, timeout mỗi regex)."""

import logging
from typing import Any

import regex

from app.finance.constants.finance_defaults import RULE_REGEX_TIMEOUT_SECONDS
from app.finance.repositories.classification_rule_repository import ClassificationRuleRepository
from app.finance.types.rule_match import RuleMatch
from app.finance.utils.content_normalizer import normalize_content

logger = logging.getLogger(__name__)


class ClassificationEngine:
    """Ưu tiên giảm dần, cùng ưu tiên thì quy tắc tạo trước; quy tắc đầu tiên khớp thắng."""

    def __init__(self, repository: ClassificationRuleRepository | None = None) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or ClassificationRuleRepository()

    def match(self, owner_id: Any, content: str) -> RuleMatch | None:
        """Quy tắc khớp đầu tiên của người dùng (None = chưa nhận diện)."""
        text = normalize_content(content)
        if not text:
            return None
        for rule in self.repository.active_for(owner_id):
            found = self.search(rule.pattern, text, rule_id=rule.pk)
            if found is not None:
                return RuleMatch(rule=rule, matched_text=found)
        return None

    def search(self, pattern: str, normalized: str, rule_id: Any = None) -> str | None:
        """Đoạn khớp đầu tiên; regex quá thời gian hoặc lỗi coi như không khớp."""
        try:
            found = regex.search(
                pattern, normalized, flags=regex.IGNORECASE, timeout=RULE_REGEX_TIMEOUT_SECONDS
            )
        except TimeoutError:
            logger.warning("Quy tắc %s chạy quá thời gian", rule_id)
            return None
        except regex.error:
            logger.warning("Quy tắc %s có regex lỗi", rule_id)
            return None
        return found.group(0) if found else None

    def is_valid(self, pattern: str) -> bool:
        """Regex biên dịch được."""
        try:
            regex.compile(pattern)
        except regex.error:
            return False
        return True
