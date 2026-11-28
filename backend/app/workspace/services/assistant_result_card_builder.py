"""Dựng thẻ kết quả từ output tool ghi: thông tin đúng do server lấy từ DB, kèm link xem lại trong Portal."""

import re
from typing import Any

from app.core.constants.defaults import DEFAULT_LOCALE
from app.core.context.user_context import get_current_request
from app.core.utils.text import to_ascii
from app.system.utils.frontend_url import get_frontend_origin
from app.workspace.constants.assistant_record_links import ASSISTANT_RECORD_LINKS, GENERIC_RECORD_LINKS

CARD_TYPE_SHORT_LINK = "short_link"
# Nhãn link là lời mời mở/xem ("Xem chi tiết", "mở tại đây") thì bỏ; nhãn khác (tên bản ghi) giữ thành chữ.
_VIEW_LABEL_HINT = re.compile(r"\b(xem|chi tiet|tai day|o day|bam|mo|link|portal)\b")
# Sau khi gỡ link, dòng chỉ còn nhãn/ký hiệu ("🔗 Link xem lại:") thì bỏ cả dòng (so khớp không dấu).
_LINE_LEFTOVER_NOISE = re.compile(
    r"xem chi tiet|xem lai|mo trong portal|duong dan|chi tiet|link|tai day|o day|xem|[^a-z0-9]+"
)
# Khóa output tool có thể chứa tên hiển thị của bản ghi (theo thứ tự ưu tiên).
_TITLE_KEYS = ("title", "name", "full_name", "claim_code", "content", "subscription", "platform", "slug")


class AssistantResultCardBuilder:
    """Đổi kết quả tool thành `cards` (FE vẽ nút thao tác) và đoạn Markdown (Telegram/Web đều đọc được)."""

    def build(self, executed_tools: list[tuple[str, dict[str, Any]]]) -> list[dict[str, Any]]:
        """Thẻ cho mọi tool tạo/sửa thành công: tiêu đề, link xem chi tiết; link rút gọn thêm thông tin."""
        cards: list[dict[str, Any]] = []
        origin = get_frontend_origin(get_current_request(), prefer_configured=True).rstrip("/")
        for name, result in executed_tools:
            info = result.get("created") or result.get("updated")
            link = ASSISTANT_RECORD_LINKS.get(name)
            if name == "update_my_record" and isinstance(info, dict):
                link = GENERIC_RECORD_LINKS.get(str(info.get("resource") or ""))
            if link is None or not result.get("ok"):
                continue
            if not isinstance(info, dict) or not info.get("id"):
                continue
            record_id = str(info["id"])
            view_url = f"{origin}/{DEFAULT_LOCALE}{link.path.format(id=record_id)}"
            title = next((str(info[key]) for key in _TITLE_KEYS if info.get(key)), "")
            card: dict[str, Any] = {
                "type": link.card_type,
                "kind_label": link.label,
                "action": "created" if name.startswith("create_") else "updated",
                "id": record_id,
                "title": title,
                "url": view_url,
                "view_url": view_url,
                "destination_url": "",
                "redirect_mode": "",
                "has_password": False,
                "expires_at": None,
                "status": str(info.get("status") or ""),
            }
            if link.card_type == CARD_TYPE_SHORT_LINK and info.get("short_url"):
                card.update(
                    {
                        "title": str(info.get("name") or info.get("slug") or ""),
                        "url": str(info["short_url"]),
                        "destination_url": str(info.get("destination_url") or ""),
                        "redirect_mode": str(info.get("redirect_mode") or ""),
                        "has_password": bool(info.get("has_password")),
                        "expires_at": info.get("expires_at"),
                    }
                )
            # Model gọi tool nhiều lần cho cùng bản ghi → chỉ giữ thẻ mới nhất.
            cards = [
                item for item in cards if not (item["type"] == card["type"] and item["id"] == card["id"])
            ]
            cards.append(card)
        return cards

    def has_full_summary(self, cards: list[dict[str, Any]]) -> bool:
        """Thẻ link rút gọn tự đủ thông tin nên thay hẳn câu chữ của model."""
        return any(card.get("type") == CARD_TYPE_SHORT_LINK for card in cards)

    def to_markdown(self, cards: list[dict[str, Any]]) -> str:
        """Câu xác nhận chuẩn khi model không viết lời dẫn; KHÔNG kèm link xem lại (nút thẻ lo việc đó)."""
        blocks: list[str] = []
        for card in cards:
            verb = "Đã tạo" if card.get("action") == "created" else "Đã cập nhật"
            if card.get("type") == CARD_TYPE_SHORT_LINK:
                expires = card.get("expires_at")
                lines = [
                    f"✅ {verb} link rút gọn **{card.get('title') or 'mới'}**",
                    f"- **Link rút gọn:** {card['url']}",
                    f"- **Link gốc:** {card.get('destination_url')}",
                    f"- **Kiểu mở:** {card.get('redirect_mode')}",
                    f"- **Mật khẩu:** {'Có' if card.get('has_password') else 'Không'}",
                    f"- **Hết hạn:** {str(expires)[:10] if expires else 'Không giới hạn'}",
                ]
                blocks.append("\n".join(lines))
            else:
                title = f" **{card['title']}**" if card.get("title") else ""
                blocks.append(f"✅ {verb} {card['kind_label']}{title}.")
        return "\n\n".join(blocks)

    def link_lines(self, cards: list[dict[str, Any]]) -> str:
        """Dòng link xem lại dạng chữ cho kênh không vẽ được thẻ (Telegram): đúng một dòng mỗi bản ghi."""
        return "\n".join(
            f"🔗 [Xem chi tiết {card['kind_label']}]({card['view_url']})"
            for card in cards
            if card.get("view_url")
        )

    def strip_view_links(self, text: str, cards: list[dict[str, Any]]) -> str:
        """Gỡ link xem lại bản ghi (model hay chép lại) khỏi lời dẫn, tránh trùng nút "Xem chi tiết" của thẻ.

        Chỉ gỡ đúng URL trang Portal của các thẻ; URL khác (trang công khai, link rút gọn) giữ nguyên.
        Dòng chỉ còn nhãn kiểu "Xem chi tiết", "🔗 Link xem lại:" sau khi gỡ thì bỏ cả dòng.
        """
        view_urls = [str(card.get("view_url") or "") for card in cards if card.get("view_url")]
        if not text or not view_urls:
            return text
        kept: list[str] = []
        for line in text.splitlines():
            if not any(url in line for url in view_urls):
                kept.append(line)
                continue
            cleaned = line
            for url in view_urls:
                cleaned = re.sub(
                    r"\[([^\]]*)\]\(" + re.escape(url) + r"\)", self._keep_meaningful_label, cleaned
                )
                cleaned = cleaned.replace(f"<{url}>", "").replace(url, "")
            if _LINE_LEFTOVER_NOISE.sub("", to_ascii(cleaned).lower()):
                cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
                cleaned = re.sub(r"\s+([,.!?])", r"\1", cleaned)
                kept.append(re.sub(r"[\s—:-]+$", "", cleaned.rstrip()))
        return re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()

    def _keep_meaningful_label(self, match: re.Match[str]) -> str:
        """Nhãn link mang nghĩa (tên bản ghi) giữ lại thành chữ; nhãn kiểu "Xem chi tiết", "tại đây" bỏ đi."""
        label = match.group(1)
        return "" if _VIEW_LABEL_HINT.search(to_ascii(label).lower()) else label
