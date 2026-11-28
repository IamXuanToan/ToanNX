"""Client embedding Google Gemini (gói free) cho RAG Trợ lý AI: timeout ngắn, chuẩn hóa L2, lỗi trả None."""

import logging
import math
from typing import Any

import requests
from django.conf import settings

from app.core.cache.cache_service import CacheService
from app.workspace.constants.workspace_defaults import (
    ASSISTANT_EMBEDDING_BATCH_SIZE,
    ASSISTANT_EMBEDDING_BATCH_TIMEOUT_SECONDS,
    ASSISTANT_EMBEDDING_COOLDOWN_SECONDS,
    ASSISTANT_EMBEDDING_DIMENSIONS,
    ASSISTANT_EMBEDDING_QUERY_TIMEOUT_SECONDS,
    GEMINI_API_BASE,
    REDIS_AI_EMBEDDING_COOLDOWN_KEY,
)

logger = logging.getLogger(__name__)

TASK_QUERY = "RETRIEVAL_QUERY"
TASK_DOCUMENT = "RETRIEVAL_DOCUMENT"
COOLDOWN_STATUS_CODES = frozenset({429, 500, 502, 503, 504})


class AssistantEmbeddingClient:
    """Gọi `embedContent` / `batchEmbedContents`; key gửi qua header (không trên URL), không log nội dung."""

    def __init__(
        self, session: requests.Session | None = None, cache_service: CacheService | None = None
    ) -> None:
        """Khởi tạo phiên HTTP và cache cooldown (Redis tắt thì bỏ qua cooldown)."""
        self.session = session or requests.Session()
        self.cache_service = cache_service or CacheService()

    @property
    def model_name(self) -> str:
        """Tên model embedding hiện hành (lưu cùng vector để biết khi nào cần nhúng lại)."""
        return str(settings.GEMINI_EMBEDDING_MODEL or "").strip()

    def is_configured(self) -> bool:
        """Có key và model mới dùng tìm theo nghĩa; ngược lại RAG chỉ dùng từ khóa."""
        return bool(str(settings.GEMINI_API_KEY or "").strip() and self.model_name)

    def embed_query(self, text: str) -> list[float] | None:
        """Vector câu hỏi (timeout ≤ 2 giây); `None` khi chưa cấu hình, đang cooldown hoặc lỗi."""
        if not text.strip() or not self._available():
            return None
        body = self._request_body(text, TASK_QUERY)
        data = self._post(
            f"models/{self.model_name}:embedContent", body, ASSISTANT_EMBEDDING_QUERY_TIMEOUT_SECONDS
        )
        values = ((data or {}).get("embedding") or {}).get("values")
        return self._normalize(values)

    def embed_documents(self, texts: list[str]) -> list[list[float] | None] | None:
        """Vector cho tối đa 100 đoạn/lần; `None` khi không gọi được, phần tử `None` khi đoạn sai chiều."""
        if not texts or not self._available():
            return None
        model_path = f"models/{self.model_name}"
        requests_body = [
            {"model": model_path, **self._request_body(text, TASK_DOCUMENT)}
            for text in texts[:ASSISTANT_EMBEDDING_BATCH_SIZE]
        ]
        data = self._post(
            f"{model_path}:batchEmbedContents",
            {"requests": requests_body},
            ASSISTANT_EMBEDDING_BATCH_TIMEOUT_SECONDS,
        )
        embeddings = (data or {}).get("embeddings")
        if not isinstance(embeddings, list):
            return None
        return [self._normalize((item or {}).get("values")) for item in embeddings]

    # ------------------------------------------------------------------ Nội bộ
    def _request_body(self, text: str, task_type: str) -> dict[str, Any]:
        return {
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
            "outputDimensionality": ASSISTANT_EMBEDDING_DIMENSIONS,
        }

    def _available(self) -> bool:
        if not self.is_configured():
            return False
        return self.cache_service.get_json(REDIS_AI_EMBEDDING_COOLDOWN_KEY) is None

    def _post(self, path: str, body: dict[str, Any], timeout: float) -> dict[str, Any] | None:
        url = f"{GEMINI_API_BASE}/{path}"
        headers = {"x-goog-api-key": str(settings.GEMINI_API_KEY), "Content-Type": "application/json"}
        try:
            response = self.session.post(url, json=body, headers=headers, timeout=timeout)
        except requests.RequestException as exc:
            logger.warning("Gemini embedding lỗi kết nối: %s", type(exc).__name__)
            self._cooldown("network")
            return None
        if response.status_code != 200:
            logger.warning("Gemini embedding trả HTTP %s", response.status_code)
            if response.status_code in COOLDOWN_STATUS_CODES:
                self._cooldown(str(response.status_code))
            return None
        try:
            payload = response.json()
        except ValueError:
            return None
        return payload if isinstance(payload, dict) else None

    def _cooldown(self, reason: str) -> None:
        self.cache_service.set_json(
            REDIS_AI_EMBEDDING_COOLDOWN_KEY, {"reason": reason}, ASSISTANT_EMBEDDING_COOLDOWN_SECONDS
        )

    def _normalize(self, values: Any) -> list[float] | None:
        """Gemini không chuẩn hóa vector khi cắt chiều (< 3072) nên tự chuẩn hóa L2; sai số chiều → None."""
        if not isinstance(values, list) or len(values) != ASSISTANT_EMBEDDING_DIMENSIONS:
            return None
        try:
            floats = [float(item) for item in values]
        except (TypeError, ValueError):
            return None
        norm = math.sqrt(sum(item * item for item in floats))
        if norm == 0:
            return None
        return [item / norm for item in floats]
