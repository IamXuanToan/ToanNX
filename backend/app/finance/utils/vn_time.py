"""Giờ Việt Nam: SePay gửi `YYYY-MM-DD HH:mm:ss` giờ VN không kèm múi giờ; báo cáo/thuế/tỷ giá theo
ngày VN."""

from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.finance.constants.finance_defaults import FINANCE_TIMEZONE

VN_TZ = ZoneInfo(FINANCE_TIMEZONE)
SEPAY_DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


def parse_sepay_datetime(value: object) -> datetime | None:
    """Chuỗi giờ VN của SePay → datetime có múi giờ; sai định dạng → None."""
    if not value:
        return None
    try:
        return datetime.strptime(str(value), SEPAY_DATETIME_FORMAT).replace(tzinfo=VN_TZ)
    except ValueError:
        return None


def vn_date(moment: datetime) -> date:
    """Ngày Việt Nam của một thời điểm có múi giờ."""
    return moment.astimezone(VN_TZ).date()
