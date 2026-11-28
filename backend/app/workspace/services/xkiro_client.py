"""Client AI OpenAI-compatible với Multi-Model Fallback + Redis cooldown + hỗ trợ stream tác vụ dài."""

import json
import logging
import time
from typing import Any

import requests
from django.conf import settings

from app.core.cache.cache_service import CacheService
from app.workspace.constants.workspace_defaults import (
    AI_MAX_MODEL_ATTEMPTS,
    AI_MAX_TOKENS,
    AI_MIN_REMAINING_FOR_FALLBACK_SECONDS,
    AI_REQUEST_DEADLINE_SECONDS,
    AI_STREAM_CONNECT_TIMEOUT_SECONDS,
    REDIS_AI_COOLDOWN_KEY,
)

logger = logging.getLogger(__name__)
RETRYABLE_STATUS_CODES = frozenset({400, 402, 404, 429, 500, 502, 503, 504})


class XkiroClient:
    """Gọi OpenAI `/chat/completions`, tự chuyển model khi quota/rate-limit và không log API key."""

    def __init__(
        self,
        session: requests.Session | None = None,
        cache_service: CacheService | None = None,
    ) -> None:
        """Khởi tạo HTTP session và Redis CacheService cho cooldown."""
        self.session = session or requests.Session()
        self.cache_service = cache_service or CacheService()

    def is_configured(self) -> bool:
        """Đã cấu hình endpoint, key và ít nhất một model từ ENV hay chưa."""
        return bool(
            settings.XKIRO_API_BASE
            and settings.XKIRO_API_KEY
            and (settings.XKIRO_MODEL or settings.XKIRO_FALLBACK_MODELS)
        )

    def candidate_models(self, preferred_model: str = "") -> list[str]:
        """Dựng danh sách ứng viên khử trùng lặp, ưu tiên non-cooldown trước."""
        raw = [preferred_model, settings.XKIRO_MODEL, *settings.XKIRO_FALLBACK_MODELS]
        ordered: list[str] = []
        for item in raw:
            name = str(item or "").strip()
            if name and name not in ordered:
                ordered.append(name)

        if not self.cache_service.enabled or not ordered:
            return ordered

        ready: list[str] = []
        cooled: list[str] = []
        for model in ordered:
            cooldown_key = REDIS_AI_COOLDOWN_KEY.format(model=model)
            if self.cache_service.get_json(cooldown_key) is not None:
                cooled.append(model)
            else:
                ready.append(model)
        # Nếu mọi model đều đang cooldown, vẫn thử tối đa 2 model đầu để hồi phục sớm.
        return ready if ready else cooled[:2]

    def chat_completion(
        self,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        preferred_model: str = "",
        deadline_monotonic: float | None = None,
        timeout_seconds: float | None = None,
        stream: bool = False,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        """Thực hiện 1 lượt gọi Chat Completions có Multi-Model Fallback và tùy chọn timeout/stream riêng."""
        if not self.is_configured():
            return {"ok": False, "error_type": "not_configured", "fallback_attempts": 0}

        deadline = deadline_monotonic or (time.monotonic() + AI_REQUEST_DEADLINE_SECONDS)
        effective_timeout = float(timeout_seconds or settings.XKIRO_TIMEOUT_SECONDS)
        candidates = self.candidate_models(preferred_model=preferred_model)[:AI_MAX_MODEL_ATTEMPTS]
        if not candidates:
            return {"ok": False, "error_type": "no_models", "fallback_attempts": 0}

        endpoint = self._endpoint_url()
        attempts = 0
        for idx, model in enumerate(candidates):
            remaining = deadline - time.monotonic()
            if attempts > 0 and remaining < AI_MIN_REMAINING_FOR_FALLBACK_SECONDS:
                break

            attempts += 1
            call_timeout = min(effective_timeout, max(1.0, remaining))
            result = self._post_once(
                endpoint,
                model,
                messages,
                tools=tools,
                timeout=call_timeout,
                stream=stream,
                max_tokens=max_tokens,
            )

            if result["ok"]:
                result["fallback_attempts"] = attempts - 1
                return result

            status_code = result.get("status_code")
            if status_code == 401:
                logger.warning("xkiro.auth_failed status=401 model=%s", model)
                return {"ok": False, "error_type": "auth_invalid", "fallback_attempts": attempts - 1}

            # Nếu model bị từ chối payload `tools` (HTTP 400) ở ứng viên cuối, thử 1 lần không tools.
            if status_code == 400 and tools and idx == len(candidates) - 1:
                rem_after = deadline - time.monotonic()
                if rem_after >= AI_MIN_REMAINING_FOR_FALLBACK_SECONDS:
                    no_tool_timeout = min(effective_timeout, rem_after)
                    retry_plain = self._post_once(
                        endpoint,
                        model,
                        messages,
                        tools=None,
                        timeout=no_tool_timeout,
                        stream=stream,
                        max_tokens=max_tokens,
                    )
                    if retry_plain["ok"]:
                        retry_plain["fallback_attempts"] = attempts - 1
                        return retry_plain

            self._mark_cooldown(model, str(result.get("error_type") or status_code or "error"))

        return {"ok": False, "error_type": "all_models_failed", "fallback_attempts": attempts}

    def _endpoint_url(self) -> str:
        base = settings.XKIRO_API_BASE.rstrip("/")
        if base.endswith("/chat/completions"):
            return base
        return f"{base}/chat/completions"

    def _post_once(
        self,
        endpoint: str,
        model: str,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None,
        timeout: float,
        stream: bool = False,
        max_tokens: int | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": int(max_tokens or AI_MAX_TOKENS),
        }
        if tools:
            payload["tools"] = tools
        if stream:
            payload["stream"] = True

        headers = {
            "Authorization": f"Bearer {settings.XKIRO_API_KEY}",
            "Content-Type": "application/json",
        }
        req_timeout: float | tuple[float, float] = (
            (min(AI_STREAM_CONNECT_TIMEOUT_SECONDS, timeout), timeout) if stream else timeout
        )
        post_kwargs: dict[str, Any] = {
            "json": payload,
            "headers": headers,
            "timeout": req_timeout,
        }
        if stream:
            post_kwargs["stream"] = True
        try:
            response = self.session.post(endpoint, **post_kwargs)
        except requests.RequestException as exc:
            logger.warning("xkiro.request_failed model=%s error=%s", model, type(exc).__name__)
            return {"ok": False, "error_type": type(exc).__name__, "status_code": None}

        if response.status_code != 200:
            logger.warning("xkiro.http_error model=%s status=%s", model, response.status_code)
            return {
                "ok": False,
                "error_type": f"http_{response.status_code}",
                "status_code": response.status_code,
            }

        if stream:
            resp_headers = getattr(response, "headers", None)
            content_type = str(resp_headers.get("content-type") or "").lower() if resp_headers else ""
            if "text/event-stream" in content_type or not content_type:
                return self._parse_stream_response(response, model)

        return self._parse_json_response(response, model)

    def _parse_json_response(self, response: Any, model: str) -> dict[str, Any]:
        try:
            body = response.json()
        except ValueError:
            return {"ok": False, "error_type": "invalid_json", "status_code": 200}

        choices = body.get("choices") or []
        if not choices or not isinstance(choices[0], dict):
            return {"ok": False, "error_type": "empty_choices", "status_code": 200}

        raw_message = choices[0].get("message") or {}
        if not isinstance(raw_message, dict):
            raw_message = {}
        message = dict(raw_message)
        message["content"] = self._extract_message_content(message.get("content"))
        usage = body.get("usage") or {}
        tokens = int(usage.get("total_tokens") or 0)
        return {
            "ok": True,
            "model": str(body.get("model") or model),
            "message": message,
            "tokens": max(0, tokens),
        }

    def _parse_stream_response(self, response: Any, model: str) -> dict[str, Any]:
        """Đọc SSE từng chunk (ép UTF-8): miễn AI còn sinh token thì không cắt ngang."""
        parts: list[str] = []
        resolved_model = model
        tokens = 0
        try:
            for raw_line in response.iter_lines(decode_unicode=False):
                if not raw_line:
                    continue
                line = (
                    raw_line.decode("utf-8", errors="replace").strip()
                    if isinstance(raw_line, (bytes, bytearray))
                    else str(raw_line).strip()
                )
                if not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                except ValueError:
                    continue
                if isinstance(chunk, dict):
                    if chunk.get("model"):
                        resolved_model = str(chunk["model"])
                    usage = chunk.get("usage")
                    if isinstance(usage, dict) and usage.get("total_tokens"):
                        tokens = int(usage["total_tokens"])
                    choices = chunk.get("choices") or []
                    if choices and isinstance(choices[0], dict):
                        delta = choices[0].get("delta") or {}
                        if isinstance(delta, dict):
                            delta_text = self._extract_message_content(delta.get("content"))
                            if delta_text:
                                parts.append(delta_text)
        except requests.RequestException as exc:
            logger.warning("xkiro.stream_failed model=%s error=%s", model, type(exc).__name__)
            if not parts:
                return {"ok": False, "error_type": type(exc).__name__, "status_code": None}

        full_text = "".join(parts)
        if not full_text.strip():
            return {"ok": False, "error_type": "empty_stream", "status_code": 200}

        return {
            "ok": True,
            "model": resolved_model,
            "message": {"role": "assistant", "content": full_text},
            "tokens": max(0, tokens),
        }

    def _extract_message_content(self, raw_content: Any) -> str:
        """Chuẩn hóa nội dung text từ string hoặc mảng multi-part OpenAI-compatible."""
        if isinstance(raw_content, str):
            return raw_content
        if isinstance(raw_content, list):
            parts: list[str] = []
            for item in raw_content:
                if isinstance(item, str) and item.strip():
                    parts.append(item)
                elif isinstance(item, dict):
                    text_val = item.get("text")
                    if isinstance(text_val, str) and text_val.strip():
                        parts.append(text_val)
            return "\n".join(parts)
        return ""

    def _mark_cooldown(self, model: str, reason: str) -> None:
        if not self.cache_service.enabled:
            return
        key = REDIS_AI_COOLDOWN_KEY.format(model=model)
        self.cache_service.set_json(key, {"reason": reason}, int(settings.XKIRO_COOLDOWN_SECONDS))
