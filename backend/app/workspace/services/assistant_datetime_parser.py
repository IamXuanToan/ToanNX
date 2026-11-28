"""Đọc ngày/giờ tiếng Việt trong câu chat ("11h30", "2 giờ chiều", "ngày mai", "5/12"), giờ Việt Nam."""

import re
from datetime import date, timedelta

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.utils.text import to_ascii
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

# "11h", "11h30", "11 gio 30", "14g", "11:30"
_TIME_PATTERN = re.compile(r"(?<![\d.])(\d{1,2})\s*(?:gio|h|g|:)(?![a-z])\s*(\d{1,2})?(?![\d])")
_DMY_PATTERN = re.compile(r"(?<!\d)(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{2,4}))?(?!\d)")
_ISO_PATTERN = re.compile(r"(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)")
_DAY_MONTH_WORDS = re.compile(r"ngay\s+(\d{1,2})\s+thang\s+(\d{1,2})(?:\s+nam\s+(\d{4}))?")
_DURATION_WORDS = ("truoc", "som", "sau", "trong", "moi")
_PM_WORDS = ("chieu", "toi", "pm")
_NOON_WORDS = ("trua",)
RELATIVE_DAYS = {"@today": 0, "@tomorrow": 1, "@day_after": 2, "@next_week": 7}
_RELATIVE_PHRASES: tuple[tuple[str, str], ...] = (
    ("ngay kia", "@day_after"),
    ("ngay mot", "@day_after"),
    ("ngay mai", "@tomorrow"),
    ("sang mai", "@tomorrow"),
    ("chieu mai", "@tomorrow"),
    ("toi mai", "@tomorrow"),
    ("tuan sau", "@next_week"),
    ("tuan toi", "@next_week"),
    ("hom nay", "@today"),
    ("sang nay", "@today"),
    ("chieu nay", "@today"),
    ("toi nay", "@today"),
    ("trua nay", "@today"),
)


class AssistantDateTimeParser:
    """Trả ngày ISO (`YYYY-MM-DD`) / giờ `HH:MM`; câu không có thông tin thì `None` (không tự đoán)."""

    def __init__(self, tz_service: WorkspaceTimezoneService | None = None) -> None:
        """Khởi tạo service múi giờ để tính "hôm nay" theo giờ Việt Nam."""
        self.tz_service = tz_service or WorkspaceTimezoneService()

    def today(self) -> date:
        """Ngày hiện tại theo múi giờ hệ thống."""
        return self.tz_service.local_today(DEFAULT_TIMEZONE)

    def find_time(self, text: str) -> str | None:
        """Giờ hẹn trong câu; bỏ qua số sau "trước/sớm/sau" (là khoảng thời gian, VD "nhắc trước 2h")."""
        lowered = self._ascii(text)
        for match in _TIME_PATTERN.finditer(lowered):
            before = lowered[max(0, match.start() - 8) : match.start()].split()
            if before and before[-1] in _DURATION_WORDS:
                continue
            value = self._to_hhmm(
                int(match.group(1)), int(match.group(2) or 0), lowered[match.end() : match.end() + 8]
            )
            if value is not None:
                return value
        return None

    def parse_time_answer(self, text: str) -> str | None:
        """Trả lời cho câu hỏi giờ: chấp nhận cả số giờ trơn ("14") ngoài các dạng của `find_time`."""
        found = self.find_time(text)
        if found is not None:
            return found
        lowered = self._ascii(text).strip()
        bare = re.fullmatch(r"(\d{1,2})(?:\s+(sang|chieu|toi|trua))?", lowered)
        if bare is None:
            return None
        return self._to_hhmm(int(bare.group(1)), 0, bare.group(2) or "")

    def find_date(self, text: str) -> str | None:
        """Ngày trong câu dạng ISO hoặc token tương đối (`@today`, `@tomorrow`...) để giải ở lúc tạo."""
        lowered = self._ascii(text)
        iso = _ISO_PATTERN.search(lowered)
        if iso:
            return self._safe_iso(int(iso.group(1)), int(iso.group(2)), int(iso.group(3)))
        words = _DAY_MONTH_WORDS.search(lowered)
        if words:
            return self._with_year(int(words.group(1)), int(words.group(2)), words.group(3))
        for match in _DMY_PATTERN.finditer(lowered):
            if lowered[max(0, match.start() - 1) : match.start()] in (":",):
                continue
            value = self._with_year(int(match.group(1)), int(match.group(2)), match.group(3))
            if value is not None:
                return value
        padded = f" {' '.join(lowered.replace('/', ' ').split())} "
        for phrase, token in _RELATIVE_PHRASES:
            if f" {phrase} " in padded:
                return token
        return None

    def resolve_date(self, value: str) -> str:
        """Đổi token tương đối thành ngày ISO theo giờ Việt Nam; ISO giữ nguyên."""
        if value in RELATIVE_DAYS:
            return (self.today() + timedelta(days=RELATIVE_DAYS[value])).isoformat()
        return value

    # ------------------------------------------------------------------ Nội bộ
    def _ascii(self, text: str) -> str:
        return " ".join(to_ascii(text or "").lower().split())

    def _to_hhmm(self, hour: int, minute: int, tail: str) -> str | None:
        words = tail.split()
        qualifier = words[0] if words else ""
        if qualifier in _PM_WORDS and hour < 12 or qualifier in _NOON_WORDS and hour < 11:
            hour += 12
        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            return None
        return f"{hour:02d}:{minute:02d}"

    def _with_year(self, day: int, month: int, year_raw: str | None) -> str | None:
        today = self.today()
        if year_raw:
            year = int(year_raw) + (2000 if len(year_raw) == 2 else 0)
            return self._safe_iso(year, month, day)
        candidate = self._safe_iso(today.year, month, day)
        if candidate is not None and candidate < today.isoformat():
            # "5/1" khi đã qua → hiểu là năm sau.
            return self._safe_iso(today.year + 1, month, day)
        return candidate

    def _safe_iso(self, year: int, month: int, day: int) -> str | None:
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None
