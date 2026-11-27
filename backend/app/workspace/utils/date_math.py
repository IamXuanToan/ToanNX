"""Hàm tính toán ngày tháng an toàn (xử lý ngày cuối tháng 29/30/31 qua tháng 2)."""

import calendar
from datetime import date


def add_months_clamped(start_date: date, months: int, *, anchor_day: int | None = None) -> date:
    """Cộng `months` tháng và kẹp theo số ngày tối đa của tháng đích.

    Args:
        start_date: Ngày bắt đầu.
        months: Số tháng cần cộng (dương hoặc 0).
        anchor_day: Ngày gốc mong muốn (1–31); mặc định lấy `start_date.day`.

    Returns:
        Ngày mới sau khi cộng tháng và kẹp cuối tháng.
    """
    if months <= 0:
        return start_date
    total_months = (start_date.year * 12 + (start_date.month - 1)) + months
    target_year, zero_based_month = divmod(total_months, 12)
    target_month = zero_based_month + 1
    max_day = calendar.monthrange(target_year, target_month)[1]
    desired_day = anchor_day if anchor_day and anchor_day > 0 else start_date.day
    return date(target_year, target_month, min(desired_day, max_day))
