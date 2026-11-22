"""Client SePay API v2 (chỉ đọc) dùng token của từng người; token chỉ đi qua tham số, không log.

Tài liệu: https://developer.sepay.vn/vi/sepay-api/v2/gioi-thieu
- Base URL theo `SEPAY_ENV`, header `Authorization: Bearer <token>`.
- Envelope `{"status": "success", "data": [...], "meta": {"pagination": {..., "has_more"}}}`.
- 3 request/giây mỗi IP; vượt trả 429 → `FINANCE_SEPAY_RATE_LIMITED`.
"""

import logging
import time
from collections.abc import Iterator
from datetime import date
from typing import Any

import requests
from django.conf import settings

from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.constants.sepay_api import (
    HTTP_OK,
    HTTP_TOO_MANY,
    HTTP_UNAUTHORIZED,
    SEPAY_API_BASE_URLS,
    SEPAY_MAX_PAGES,
    SEPAY_MAX_PER_PAGE,
    SEPAY_PAGE_INTERVAL_SECONDS,
    SEPAY_TIMEOUT_SECONDS,
)
from app.finance.exceptions.sepay_api_error import SepayApiError

logger = logging.getLogger(__name__)


class SepayApiClient:
    """Phân trang theo `has_more`, giãn nhịp theo rate limit."""

    def __init__(self, session: requests.Session | None = None) -> None:
        """Khởi tạo client."""
        self.session = session or requests.Session()

    @property
    def base_url(self) -> str:
        """Base URL API v2 theo `SEPAY_ENV`."""
        return SEPAY_API_BASE_URLS[str(settings.SEPAY_ENV)]

    def list_bank_accounts(self, token: str) -> list[dict[str, Any]]:
        """Tài khoản ngân hàng liên kết (`GET /v2/bank-accounts`) — dùng để kiểm token."""
        return list(self._paginate(token, "/bank-accounts", {}))

    def iter_transactions(self, token: str, date_from: date, date_to: date) -> Iterator[dict[str, Any]]:
        """Giao dịch trong khoảng ngày (`GET /v2/transactions`), cũ trước mới sau."""
        yield from self._paginate(
            token,
            "/transactions",
            {
                "transaction_date_from": date_from.isoformat(),
                "transaction_date_to": date_to.isoformat(),
                "transaction_date_sort": "asc",
            },
        )

    def _paginate(self, token: str, path: str, params: dict[str, Any]) -> Iterator[dict[str, Any]]:
        for page in range(1, SEPAY_MAX_PAGES + 1):
            if page > 1:
                time.sleep(SEPAY_PAGE_INTERVAL_SECONDS)
            body = self._get(token, path, {**params, "page": page, "per_page": SEPAY_MAX_PER_PAGE})
            yield from body.get("data") or []
            if not ((body.get("meta") or {}).get("pagination") or {}).get("has_more"):
                return
        logger.warning("SePay %s còn trang sau %s trang, dừng để tránh lặp vô hạn", path, SEPAY_MAX_PAGES)

    def _get(self, token: str, path: str, params: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self.session.get(
                f"{self.base_url}{path}",
                params=params,
                headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
                timeout=SEPAY_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            logger.warning("Không gọi được SePay %s: %s", path, type(exc).__name__)
            raise SepayApiError() from exc
        if response.status_code == HTTP_UNAUTHORIZED:
            raise SepayApiError(
                "SePay từ chối token (sai, hết hạn hoặc khác môi trường).",
                code=FinanceErrorCode.SEPAY_TOKEN_INVALID,
            )
        if response.status_code == HTTP_TOO_MANY:
            raise SepayApiError(
                "SePay đang giới hạn tần suất, thử lại sau ít phút.", code=FinanceErrorCode.SEPAY_RATE_LIMITED
            )
        if response.status_code != HTTP_OK:
            logger.warning("SePay %s trả HTTP %s", path, response.status_code)
            raise SepayApiError()
        try:
            body = response.json()
        except ValueError as exc:
            raise SepayApiError() from exc
        if not isinstance(body, dict) or body.get("status") != "success":
            raise SepayApiError()
        return body
