"""Chặn URL model bịa: chỉ giữ URL có trong dữ liệu tool, tin người dùng hoặc origin hệ thống."""

import re
from typing import Any
from urllib.parse import urlsplit

_MARKDOWN_LINK = re.compile(r"\[([^\]]*)\]\((https?://[^\s)]+)\)")
_BARE_URL = re.compile(r"https?://[^\s<>()\[\]\"'`]+")
_TRAILING = ".,;:!?*_"


# Markup gọi tool một số model tự in vào nội dung (DSML, `<｜...｜>`, `tool_calls>`...): không hiện ra.
_TOOL_MARKUP_LINE = re.compile(
    r"(DSML|<\s*/?\s*[|｜]|[|｜]\s*(invoke|parameter|tool_calls|function_calls)"
    r"|</?\s*(tool_calls|function_calls|invoke)\b)",
    re.IGNORECASE,
)


class AssistantReplyGuard:
    """Thay URL lạ bằng URL thật cùng slug (nếu có thẻ kết quả) hoặc gỡ bỏ, giữ nguyên chữ còn lại."""

    def strip_tool_markup(self, text: str) -> str:
        """Bỏ các dòng chứa markup gọi tool bị model in lẫn vào câu trả lời."""
        kept = [line for line in (text or "").splitlines() if not _TOOL_MARKUP_LINE.search(line)]
        return "\n".join(kept).strip()

    def sanitize(
        self,
        text: str,
        *,
        trusted_texts: list[str],
        origin: str = "",
        cards: list[dict[str, Any]] | None = None,
    ) -> str:
        """Văn bản đã lọc URL; `trusted_texts` gồm tin người dùng và output tool (JSON) của lượt này."""
        if not text:
            return text
        trusted_blob = "\n".join(item for item in trusted_texts if item)
        card_urls = [str(card.get("url") or "") for card in (cards or []) if card.get("url")]

        def is_trusted(url: str) -> bool:
            if url in trusted_blob or url in card_urls:
                return True
            return bool(origin) and url.startswith(origin.rstrip("/") + "/")

        def replacement(url: str) -> str | None:
            last = urlsplit(url).path.rstrip("/").rsplit("/", 1)[-1].lower()
            for real in card_urls:
                if last and urlsplit(real).path.rstrip("/").rsplit("/", 1)[-1].lower() == last:
                    return real
            return None

        def fix_markdown(match: re.Match[str]) -> str:
            label, url = match.group(1), match.group(2)
            if is_trusted(url):
                return match.group(0)
            real = replacement(url)
            return f"[{label}]({real})" if real else label

        result = _MARKDOWN_LINK.sub(fix_markdown, text)

        def fix_bare(match: re.Match[str]) -> str:
            raw = match.group(0)
            url = raw.rstrip(_TRAILING)
            tail = raw[len(url) :]
            if is_trusted(url):
                return raw
            real = replacement(url)
            return (real or "") + tail

        # Chỉ quét URL trần ngoài cú pháp Markdown đã xử lý: URL trong `(...)` của link hợp lệ được giữ.
        parts = re.split(r"(\[[^\]]*\]\(https?://[^\s)]+\))", result)
        cleaned = [
            part if part.startswith("[") and "](" in part else _BARE_URL.sub(fix_bare, part) for part in parts
        ]
        return re.sub(r"[ \t]+\n", "\n", "".join(cleaned)).strip()
