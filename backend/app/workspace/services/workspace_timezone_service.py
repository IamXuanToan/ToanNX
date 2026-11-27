"""Tiện ích múi giờ IANA và khung giờ HH:MM cho cấu hình cá nhân trong Workspace."""

from datetime import date, datetime, time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone as dj_timezone

from app.core.constants.defaults import DEFAULT_TIMEZONE


class WorkspaceTimezoneService:
    """Chuẩn hóa múi giờ `ZoneInfo` và chuyển đổi thời điểm theo cài đặt của owner."""

    def resolve_zone(self, timezone_name: str | None) -> ZoneInfo:
        """Trả `ZoneInfo` hợp lệ (lỗi tên múi giờ → lùi về `DEFAULT_TIMEZONE`)."""
        candidate = (timezone_name or "").strip() or DEFAULT_TIMEZONE
        try:
            return ZoneInfo(candidate)
        except ZoneInfoNotFoundError:
            return ZoneInfo(DEFAULT_TIMEZONE)

    def is_valid_zone(self, timezone_name: str) -> bool:
        """Kiểm tra tên múi giờ IANA hợp lệ hay không."""
        candidate = (timezone_name or "").strip()
        if not candidate:
            return False
        try:
            ZoneInfo(candidate)
        except ZoneInfoNotFoundError:
            return False
        return True

    def local_today(self, timezone_name: str | None, *, now: datetime | None = None) -> date:
        """Ngày hiện tại theo múi giờ của owner."""
        current = now or dj_timezone.now()
        return current.astimezone(self.resolve_zone(timezone_name)).date()

    def local_now(self, timezone_name: str | None, *, now: datetime | None = None) -> datetime:
        """Thời điểm hiện tại theo múi giờ của owner."""
        current = now or dj_timezone.now()
        return current.astimezone(self.resolve_zone(timezone_name))

    def parse_hhmm(self, slot: str) -> time | None:
        """Phân tích chuỗi `HH:MM` thành `datetime.time`; sai định dạng → None."""
        cleaned = (slot or "").strip()
        if len(cleaned) != 5 or cleaned[2] != ":":
            return None
        hh_str, mm_str = cleaned.split(":", 1)
        if not (hh_str.isdigit() and mm_str.isdigit()):
            return None
        hour, minute = int(hh_str), int(mm_str)
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            return None
        return time(hour=hour, minute=minute)

    def local_to_utc(self, target_date: date, target_time: time, timezone_name: str | None) -> datetime:
        """Đổi ngày + giờ địa phương sang datetime UTC."""
        zone = self.resolve_zone(timezone_name)
        naive = datetime.combine(target_date, target_time)
        return naive.replace(tzinfo=zone).astimezone(dj_timezone.get_default_timezone())
