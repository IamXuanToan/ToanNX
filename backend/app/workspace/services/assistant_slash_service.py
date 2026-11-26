"""8 lệnh Slash 0-token của Trợ lý AI (chạy nội bộ ngay lập tức, không tốn quota LLM)."""

from datetime import date, time
from decimal import Decimal
from typing import Any

from app.workspace.constants.workspace_defaults import SLASH_COMMAND_NAMES
from app.workspace.models.reminder import Reminder
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService


class AssistantSlashService:
    """Thực thi `/today`, `/upcoming`, `/spending`, `/assets`, `/status`, `/remind`, `/newchat`, `/help`."""

    def __init__(
        self,
        tools_service: AssistantToolsService | None = None,
        setting_service: WorkspaceSettingService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo service tool 8 hàm và múi giờ người dùng."""
        self.tools_service = tools_service or AssistantToolsService()
        self.setting_service = setting_service or WorkspaceSettingService()
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

        if cmd == "/help":
            return {
                "reply": (
                    "Các lệnh nhanh (0 token LLM):\n"
                    "• /today — Việc cần làm & nhắc hẹn hôm nay\n"
                    "• /upcoming [số_ngày] — Gói dịch vụ sắp gia hạn\n"
                    "• /spending [mm/yyyy] — Tổng chi tiêu cá nhân trong tháng\n"
                    "• /assets [từ khóa] — Tra cứu thiết bị & bảo hành\n"
                    "• /status — Tình trạng Uptime các website/API\n"
                    "• /remind <DD/MM> <HH:MM> <nội dung> — Tạo nhắc việc nhanh\n"
                    "• /newchat — Bắt đầu phiên hội thoại mới\n"
                    "• /help — Xem hướng dẫn lệnh"
                ),
                "contains_private_data": False,
                "is_new_chat": False,
            }

        if cmd == "/newchat":
            return {
                "reply": "Đã mở phiên trò chuyện mới. Bạn cần mình hỗ trợ gì tiếp theo?",
                "contains_private_data": False,
                "is_new_chat": True,
            }

        if not allow_personal_tools:
            return {
                "reply": "Chế độ nhóm hiện tại không cho phép truy vấn dữ liệu cá nhân của chủ phòng.",
                "contains_private_data": False,
                "is_new_chat": False,
            }

        if cmd == "/today":
            res = self.tools_service.execute_tool(actor, "get_pending_reminders", {"scope": "today"})
            items = res.get("items") or []
            if not items:
                reply = "Hôm nay bạn không có nhắc việc nào đang chờ."
            else:
                lines = [
                    f"• [{it['priority']}] {it['title']}"
                    + (f" ({it['due_time']})" if it.get("due_time") else "")
                    for it in items
                ]
                reply = f"Nhắc việc hôm nay ({res.get('total_count', len(items))}):\n" + "\n".join(lines)
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if cmd == "/upcoming":
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

        if cmd == "/spending":
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

        if cmd == "/assets":
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
                    f"• {it['name']} ({it['status']}) — BH tới: {it.get('warranty_end_date') or 'Không'}"
                    for it in items
                ]
                reply = f"Thiết bị tìm thấy ({res.get('total_count', len(items))}):\n" + "\n".join(lines)
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if cmd == "/status":
            res = self.tools_service.execute_tool(actor, "get_monitor_health", {})
            items = res.get("items") or []
            if not items:
                reply = "Bạn chưa thiết lập mục tiêu giám sát Uptime nào."
            else:
                lines = [f"• {it['name']}: {it['status']} ({it.get('latency_ms') or '-'} ms)" for it in items]
                reply = (
                    f"Tình trạng Uptime ({res['healthy_count']}/{res['total_count']} ổn định):\n"
                    + "\n".join(lines)
                )
            return {"reply": reply, "contains_private_data": True, "is_new_chat": False}

        if cmd == "/remind":
            if not is_owner:
                return {
                    "reply": "Chỉ chủ sở hữu mới có thể tạo nhắc việc bằng lệnh /remind.",
                    "contains_private_data": False,
                    "is_new_chat": False,
                }
            return self._handle_remind(actor, rest)

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
                    "Cú pháp đúng: /remind <DD/MM> <HH:MM> <nội dung> (VD: /remind 28/11 09:00 Gia hạn SSL)"
                ),
                "contains_private_data": False,
                "is_new_chat": False,
            }
        date_str, time_str, title = parts[0], parts[1], parts[2].strip()
        day_parts = date_str.split("/")
        setting = self.setting_service.get_or_create_for_owner(actor)
        today_local = self.tz_service.local_today(setting.timezone)
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
