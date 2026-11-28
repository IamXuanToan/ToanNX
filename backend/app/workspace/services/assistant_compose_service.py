"""Nghiệp vụ sinh và biên tập nội dung chuẩn HTML Tiptap bằng AI (kèm RAG dữ liệu cá nhân)."""

import json
import re
import time
from typing import Any

from django.conf import settings

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.workspace.constants.workspace_defaults import (
    AI_COMPOSE_DEADLINE_SECONDS,
    AI_COMPOSE_MAX_TOKENS,
)
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.services.xkiro_client import XkiroClient

COMPOSE_SYSTEM_PROMPT = (
    "Bạn là trợ lý biên tập nội dung chuyên nghiệp cho trình soạn thảo Tiptap Editor. "
    "Chốt an toàn: không nói về khủng bố, bạo lực cực đoan, vũ khí, quân sự hay phân biệt vùng miền. "
    "Định dạng đầu ra BẮT BUỘC:\n"
    "- CHỈ trả về HTML ngữ nghĩa sạch, tương thích trực tiếp với Tiptap: "
    "`<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<pre><code>`, "
    "`<strong>`, `<em>`, `<a>`.\n"
    "- TUYỆT ĐỐI KHÔNG bọc trong markdown code fence (như ```html ... ```), "
    "KHÔNG trả thẻ `<html>`, `<head>`, `<body>`, `<script>`, `<style>`, `<iframe>`.\n"
    "- Trình bày mạch lạc, tự nhiên bằng tiếng Việt có dấu (trừ khi người dùng yêu cầu tiếng Anh). "
    "Nếu có dữ liệu RAG cá nhân đi kèm, chỉ dùng số liệu thật, không bịa đặt."
)

DANGEROUS_TAG_RE = re.compile(r"<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*/\s*\1\s*>", re.I)
EVENT_ATTR_RE = re.compile(r"\s+on[a-z]+\s*=\s*(['\"]).*?\1", re.I)
CODE_FENCE_RE = re.compile(r"^```(?:html)?\s*\n?([\s\S]*?)\n?```\s*$", re.I)


class AssistantComposeService:
    """Sinh/viết lại/tóm tắt nội dung HTML chuẩn Tiptap qua `XkiroClient` và dữ liệu RAG theo quyền RBAC."""

    def __init__(
        self,
        xkiro_client: XkiroClient | None = None,
        config_service: AssistantConfigService | None = None,
        tools_service: AssistantToolsService | None = None,
    ) -> None:
        """Khởi tạo AI client, cấu hình Bot và service lấy ngữ cảnh RAG cá nhân."""
        self.xkiro_client = xkiro_client or XkiroClient()
        self.config_service = config_service or AssistantConfigService()
        self.tools_service = tools_service or AssistantToolsService()

    def compose(self, actor: Any, data: dict[str, Any]) -> dict[str, Any]:
        """Sinh nội dung HTML chuẩn Tiptap từ yêu cầu, đoạn chọn, ngữ cảnh tài liệu và RAG cá nhân."""
        if not self.xkiro_client.is_configured():
            raise BusinessRuleError(
                "Trợ lý AI chưa được cấu hình trên hệ thống.",
                code=WorkspaceErrorCode.AI_NOT_CONFIGURED,
            )

        prompt = str(data.get("prompt") or "").strip()
        mode = str(data.get("mode") or "generate").strip()
        selected_text = str(data.get("selected_text") or "").strip()
        doc_context = str(data.get("document_context") or "").strip()
        use_rag = bool(data.get("use_personal_rag", True))

        rag_sources: list[str] = []
        rag_blocks: list[str] = []
        if use_rag:
            rag_sources, rag_blocks = self._collect_rag_context(actor, prompt)

        mode_instruction = self._mode_instruction(mode)
        user_parts = [f"Chế độ: {mode_instruction}", f"Yêu cầu của người dùng: {prompt}"]
        if selected_text:
            user_parts.append(f"Đoạn văn bản đang chọn:\n{selected_text}")
        if doc_context:
            user_parts.append(f"Ngữ cảnh tài liệu xung quanh:\n{doc_context[:2000]}")
        if rag_blocks:
            user_parts.append("Dữ liệu cá nhân tham khảo (RAG):\n" + "\n".join(rag_blocks))

        cfg = self.config_service.get_config()
        preferred_model = str(cfg.get("preferred_ai_model") or "")
        result = self.xkiro_client.chat_completion(
            [
                {"role": "system", "content": COMPOSE_SYSTEM_PROMPT},
                {"role": "user", "content": "\n\n".join(user_parts)},
            ],
            tools=None,
            preferred_model=preferred_model,
            deadline_monotonic=time.monotonic() + AI_COMPOSE_DEADLINE_SECONDS,
            timeout_seconds=float(settings.XKIRO_COMPOSE_TIMEOUT_SECONDS),
            stream=True,
            max_tokens=AI_COMPOSE_MAX_TOKENS,
        )
        if not result.get("ok"):
            raise BusinessRuleError(
                "Hệ thống AI tạm thời quá tải hoặc không phản hồi, vui lòng thử lại.",
                code=WorkspaceErrorCode.AI_UNAVAILABLE,
            )

        raw_content = str((result.get("message") or {}).get("content") or "").strip()
        clean_html = self._sanitize_tiptap_html(raw_content)
        return {
            "html": clean_html,
            "model_used": str(result.get("model") or ""),
            "tokens_used": int(result.get("tokens") or 0),
            "rag_sources": rag_sources,
        }

    def _collect_rag_context(self, actor: Any, prompt: str) -> tuple[list[str], list[str]]:
        """Truy xuất ngữ cảnh cá nhân phù hợp (kiểm quyền RBAC, không đọc Két sắt/Admin)."""
        lowered = prompt.lower()
        sources: list[str] = []
        blocks: list[str] = []

        candidates: list[tuple[str, str, dict[str, Any], tuple[str, ...]]] = [
            (
                "Nhắc việc",
                "get_pending_reminders",
                {"scope": "week"},
                ("nhắc", "việc", "hẹn", "lịch", "tuần"),
            ),
            (
                "Tài chính",
                "get_finance_income_summary",
                {"days": 30},
                ("thu nhập", "dòng tiền", "tài chính", "doanh thu", "tiền", "báo cáo"),
            ),
            ("Thiết bị", "get_assets_and_warranty", {}, ("thiết bị", "bảo hành", "máy", "laptop")),
            (
                "Dịch vụ định kỳ",
                "get_upcoming_subscriptions",
                {"days_ahead": 30},
                ("dịch vụ", "gia hạn", "vps", "domain"),
            ),
            (
                "Thống kê cá nhân",
                "get_personal_statistics",
                {},
                ("thống kê", "tổng kết", "báo cáo", "tổng quan"),
            ),
        ]
        for label, tool_name, args, keywords in candidates:
            if not any(kw in lowered for kw in keywords):
                continue
            out = self.tools_service.execute_tool(actor, tool_name, args, is_owner=True)
            if out.get("ok"):
                sources.append(label)
                blocks.append(f"[{label}]: {json.dumps(out, ensure_ascii=False)[:1200]}")
        return sources, blocks

    @staticmethod
    def _mode_instruction(mode: str) -> str:
        mapping = {
            "generate": "Tạo mới nội dung hoàn chỉnh, chia mục rõ ràng.",
            "rewrite": "Viết lại đoạn đang chọn cho tự nhiên, chuyên nghiệp và mạch lạc hơn.",
            "expand": "Mở rộng chi tiết, bổ sung lập luận hoặc ví dụ cho đoạn đang chọn.",
            "summarize": "Tóm tắt ngắn gọn các ý chính bằng đoạn văn hoặc gạch đầu dòng.",
            "fix_grammar": "Sửa lỗi chính tả, dấu câu và ngữ pháp tiếng Việt/Anh, giữ nguyên ý gốc.",
        }
        return mapping.get(mode, mapping["generate"])

    @staticmethod
    def _sanitize_tiptap_html(raw: str) -> str:
        cleaned = raw.strip()
        fence_match = CODE_FENCE_RE.match(cleaned)
        if fence_match:
            cleaned = fence_match.group(1).strip()
        cleaned = DANGEROUS_TAG_RE.sub("", cleaned)
        cleaned = EVENT_ATTR_RE.sub("", cleaned)
        if not cleaned:
            return "<p></p>"
        if not cleaned.startswith("<"):
            paragraphs = [f"<p>{line.strip()}</p>" for line in cleaned.splitlines() if line.strip()]
            return "".join(paragraphs) or "<p></p>"
        return cleaned
