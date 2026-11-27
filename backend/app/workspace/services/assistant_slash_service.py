"""6 lệnh Slash 0-token của Trợ lý AI (hỗ trợ chuẩn tiếng Việt + alias tiếng Anh, không tốn quota LLM)."""

from datetime import date, time
from decimal import Decimal
from typing import Any

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.workspace.constants.workspace_defaults import (
    ASSISTANT_COMMANDS,
    SLASH_COMMAND_ALIASES,
    SLASH_COMMAND_NAMES,
)
from app.workspace.models.reminder import Reminder
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

PRIORITY_LABELS_VI: dict[str, str] = {
    "LOW": "Thấp",
    "MEDIUM": "Trung bình",
    "HIGH": "Cao",
    "URGENT": "Khẩn cấp",
}

ASSET_STATUS_LABELS_VI: dict[str, str] = {
    "IN_USE": "Đang dùng",
    "BACKUP": "Dự phòng",
    "IN_WARRANTY": "Đang bảo hành",
    "IN_REPAIR": "Đang sửa chữa",
    "SOLD": "Đã bán",
    "BROKEN": "Đã hỏng",
}


class AssistantSlashService:
    """Thực thi `/hom_nay`, `/sap_toi`, `/chi_tieu`, `/thiet_bi`, `/nhac_viec`, `/tro_giup` và alias EN."""

    def __init__(
        self,
        tools_service: AssistantToolsService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo service tool và múi giờ mặc định."""
        self.tools_service = tools_service or AssistantToolsService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    def parse_command(self, text: str) -> tuple[str, str]:
        """Tách lệnh dạng `/cmd@bot arg...` thành `("/cmd", "arg...")`."""
        stripped = (text or "").strip()
        if not stripped.startswith("/"):
            return "", stripped
        parts = stripped.split(maxsplit=1)
        cmd_token = parts[0].split("@", 1)[0].lower()
        rest = parts[1].strip() if len(parts) > 1 else ""
        return cmd_token, rest

    def execute(
        self,
        actor: Any,
        text: str,
        *,
        is_owner: bool = True,
        allow_personal_tools: bool = True,
        hide_amounts: bool = False,
    ) -> dict[str, Any]:
        """Thực thi một lệnh Slash `0 token` và trả về nội dung văn bản kèm cờ bảo mật."""
        cmd, rest = self.parse_command(text)
        canonical = SLASH_COMMAND_ALIASES.get(cmd, "")

        if canonical == "help":
            include_en_alias = cmd == "/help"
            lines = ["Các lệnh nhanh (0 token AI):"]
            for spec in ASSISTANT_COMMANDS:
                if spec["telegram_only"]:
                    continue
                alias_suffix = f" ({spec['en_command']})" if include_en_alias else ""
                lines.append(f"• {spec['syntax']}{alias_suffix} — {spec['description']}")
            return {
                "reply": "\n".join(lines),
                "contains_private_data": False,
                "is_new_chat": False,
            }

        if not allow_personal_tools:
            return {
                "reply": "Chế độ nhóm hiện tại không cho phép truy vấn dữ liệu cá nhân của chủ phòng.",
                "contains_private_data": False,
                "is_new_chat": False,
            }

        if canonical == "today":
            res = self.tools_service.execute_tool(actor, "get_pending_reminders", {"scope": "today"})
            items = res.get("items") or []
            if not items:
                reply = "Hôm nay bạn không có nhắc việc nào đang chờ."
            else:
                lines = [
                    f"• [{PRIORITY_LABELS_VI.get(str(it['priority']), it['priority'])}] {it['title']}"
                    + (f" ({it['due_time']})" if it.get("due_time") else "")
                    for it in items
                ]
                reply = f"Nhắc việc hôm nay ({res.get('total_count', len(items))}):\n" + "\n".join(lines)
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if canonical == "upcoming":
            days = int(rest) if rest.isdigit() and 1 <= int(rest) <= 90 else 14
            res = self.tools_service.execute_tool(
                actor,
                "get_upcoming_subscriptions",
                {"days_ahead": days},
                hide_amounts=hide_amounts,
            )
            items = res.get("items") or []
            if not items:
                reply = f"Không có dịch vụ định kỳ nào cần gia hạn trong {days} ngày tới."
            else:
                lines = [
                    f"• {it['name']} — {it['renew_date']} ({self._fmt_money(it['amount_vnd'])})"
                    for it in items
                ]
                reply = f"Dịch vụ sắp gia hạn ({days} ngày tới):\n" + "\n".join(lines)
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if canonical == "spending":
            args: dict[str, Any] = {}
            if rest and "/" in rest:
                m_str, y_str = rest.split("/", 1)
                if m_str.isdigit() and y_str.isdigit():
                    args = {"month": int(m_str), "year": int(y_str)}
            res = self.tools_service.execute_tool(
                actor, "get_spending_summary", args, hide_amounts=hide_amounts
            )
            if not res.get("ok"):
                return {
                    "reply": str(res.get("error") or "Không thể tổng hợp chi tiêu."),
                    "contains_private_data": False,
                    "is_new_chat": False,
                }
            reply = (
                f"Chi tiêu tháng {res['month']:02d}/{res['year']}:\n"
                f"• Tổng đã chi: {self._fmt_money(res['total_spent_vnd'])}\n"
                f"• Gia hạn dịch vụ: {self._fmt_money(res['subscription_paid_vnd'])}\n"
                f"• Mua thiết bị: {self._fmt_money(res['asset_purchase_vnd'])}\n"
                f"• Bảo hành / Sửa chữa: {self._fmt_money(res['warranty_repair_vnd'])}\n"
                f"• Dự kiến gia hạn còn lại: {self._fmt_money(res['projected_subscriptions_vnd'])}"
            )
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if canonical == "assets":
            res = self.tools_service.execute_tool(
                actor,
                "get_assets_and_warranty",
                {"query": rest},
                hide_amounts=hide_amounts,
            )
            items = res.get("items") or []
            if not items:
                reply = "Không tìm thấy thiết bị nào phù hợp."
            else:
                lines = [
                    f"• {it['name']} ({ASSET_STATUS_LABELS_VI.get(str(it['status']), it['status'])}) "
                    f"— BH tới: {it.get('warranty_end_date') or 'Không'}"
                    for it in items
                ]
                reply = f"Thiết bị tìm thấy ({res.get('total_count', len(items))}):\n" + "\n".join(lines)
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if canonical == "remind":
            if not is_owner:
                return {
                    "reply": "Chỉ chủ sở hữu mới có thể tạo nhắc việc bằng lệnh /nhac_viec.",
                    "contains_private_data": False,
                    "is_new_chat": False,
                }
            return self._handle_remind(actor, rest)

        if canonical == "clear":
            return {
                "reply": "🧹 Đã xóa lịch sử trò chuyện hiện tại.",
                "contains_private_data": False,
                "is_new_chat": True,
            }

        supported = ", ".join(SLASH_COMMAND_NAMES)
        return {
            "reply": f"Lệnh '{cmd}' chưa được hỗ trợ. Dùng một trong: {supported}",
            "contains_private_data": False,
            "is_new_chat": False,
        }

    def _handle_remind(self, actor: Any, rest: str) -> dict[str, Any]:
        parts = rest.split(maxsplit=2)
        if len(parts) < 3 or "/" not in parts[0]:
            return {
                "reply": (
                    "Cú pháp đúng: /nhac_viec <DD/MM> <HH:MM> <nội_dung> "
                    "(VD: /nhac_viec 28/11 09:00 Gia hạn SSL)"
                ),
                "contains_private_data": False,
                "is_new_chat": False,
            }
        date_str, time_str, title = parts[0], parts[1], parts[2].strip()
        day_parts = date_str.split("/")
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
        try:
            day_num = int(day_parts[0])
            month_num = int(day_parts[1])
            year_num = int(day_parts[2]) if len(day_parts) >= 3 else today_local.year
            due_date_val = date(year_num, month_num, day_num)
            if len(day_parts) < 3 and due_date_val < today_local:
                due_date_val = date(year_num + 1, month_num, day_num)
        except ValueError:
            return {
                "reply": "Ngày nhắc việc không hợp lệ (dùng dạng DD/MM hoặc DD/MM/YYYY).",
                "contains_private_data": False,
                "is_new_chat": False,
            }

        parsed_time: time | None = self.tz_service.parse_hhmm(time_str)
        if parsed_time is None:
            return {
                "reply": "Giờ nhắc việc không hợp lệ (dùng dạng HH:MM).",
                "contains_private_data": False,
                "is_new_chat": False,
            }

        res = self.tools_service.execute_tool(
            actor,
            "create_quick_reminder",
            {
                "title": title,
                "due_date": due_date_val.isoformat(),
                "due_time": parsed_time.strftime("%H:%M"),
                "priority": Reminder.Priority.MEDIUM,
            },
            is_owner=True,
        )
        if not res.get("ok"):
            return {
                "reply": str(res.get("error") or "Không tạo được nhắc việc."),
                "contains_private_data": False,
                "is_new_chat": False,
            }
        created = res["created"]
        return {
            "reply": (
                f"✅ Đã đặt nhắc việc '{created['title']}' "
                f"lúc {created['due_time']} ngày {created['due_date']}."
            ),
            "contains_private_data": True,
            "is_new_chat": False,
        }

    def _fmt_money(self, val: Any) -> str:
        if isinstance(val, str):
            return val
        return f"{int(Decimal(str(val or 0))):,} đ".replace(",", ".")
