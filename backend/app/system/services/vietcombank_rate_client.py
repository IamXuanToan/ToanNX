"""Client tỷ giá Vietcombank (mua chuyển khoản) theo ngày.

`GET https://www.vietcombank.com.vn/api/exchangerates?date=YYYY-MM-DD` trả
`{"Date": "...", "UpdatedDate": "...", "Count": n,
"Data": [{"currencyCode": "USD", "transfer": "25600.00", ...}]}`.
Kết quả gọi thử 21/11/2026: ngày thường và thứ bảy có số (thứ bảy mang tỷ giá cuối ngày thứ sáu);
ngày chưa tới trả `Count = 0`. Endpoint không có tài liệu chính thức nên có thể đổi: lỗi thì báo
người dùng nhập tay.
"""

import logging
from datetime import date
from decimal import Decimal, InvalidOperation

import requests

from app.system.constants.currency_defaults import EXCHANGE_RATE_TIMEOUT_SECONDS, VIETCOMBANK_RATE_URL

logger = logging.getLogger(__name__)


class VietcombankRateClient:
    """Chỉ đọc; không retry tự động (mỗi ngày mỗi tiền tệ gọi một lần nhờ đệm DB)."""

    def __init__(self, session: requests.Session | None = None) -> None:
        """Khởi tạo client."""
        self.session = session or requests.Session()

    def transfer_buy_rate(self, currency_code: str, day: date) -> Decimal | None:
        """Tỷ giá mua chuyển khoản của một ngày.

        Returns:
            Tỷ giá; None khi ngày đó chưa có số (ngày nghỉ, ngày chưa tới, mã không có).

        Raises:
            requests.RequestException | ValueError: Lỗi kết nối hoặc dữ liệu hỏng (nơi gọi đổi thành
                lỗi nghiệp vụ).
        """
        response = self.session.get(
            VIETCOMBANK_RATE_URL, params={"date": day.isoformat()}, timeout=EXCHANGE_RATE_TIMEOUT_SECONDS
        )
        response.raise_for_status()
        body = response.json()
        for row in body.get("Data") or []:
            if str(row.get("currencyCode", "")).upper() != currency_code.upper():
                continue
            try:
                rate = Decimal(str(row.get("transfer") or "0").replace(",", ""))
            except InvalidOperation:
                logger.warning("Tỷ giá Vietcombank %s ngày %s không đọc được", currency_code, day)
                return None
            return rate if rate > 0 else None
        return None
