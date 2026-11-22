"""Tỷ giá: tra theo ngày (đệm DB → API Vietcombank, lùi tối đa 7 ngày), nhập tay dòng MANUAL."""

import contextlib
import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

import requests
from django.db import transaction
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.currency_defaults import EXCHANGE_RATE_LOOKBACK_DAYS
from app.system.constants.currency_error_code import CurrencyErrorCode
from app.system.models.currency import Currency
from app.system.models.exchange_rate import ExchangeRate
from app.system.repositories.currency_repository import CurrencyRepository
from app.system.repositories.exchange_rate_repository import ExchangeRateRepository
from app.system.services.vietcombank_rate_client import VietcombankRateClient
from app.system.types.fetched_rate import FetchedRate

logger = logging.getLogger(__name__)
Source = ExchangeRate.Source
BASE_RATE = Decimal(1)


class ExchangeRateService(CoreCrudService[ExchangeRate, ExchangeRateRepository]):
    """Dòng API chỉ đọc; CRUD qua API chỉ tạo/sửa/xóa dòng MANUAL."""

    repository_class = ExchangeRateRepository

    def __init__(
        self,
        repository: ExchangeRateRepository | None = None,
        currency_repository: CurrencyRepository | None = None,
        client: VietcombankRateClient | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or ExchangeRateRepository())
        self.currency_repository = currency_repository or CurrencyRepository()
        self.client = client or VietcombankRateClient()

    # ------------------------------------------------------------------ tra cứu
    def resolve(
        self, currency: Currency, day: date, source: str = Source.VIETCOMBANK_TRANSFER_BUY
    ) -> FetchedRate:
        """Tỷ giá dùng cho một ngày.

        - Tiền tệ gốc → 1.
        - MANUAL: dòng nhập tay đúng ngày, không có thì ngày gần nhất trước đó trong 7 ngày.
        - Vietcombank: đệm DB đúng ngày → gọi API; ngày chưa có số thì lùi từng ngày tối đa 7 ngày.

        Raises:
            BusinessRuleError: Không có tỷ giá (`SYSTEM_EXCHANGE_RATE_UNAVAILABLE`).
        """
        if currency.is_base:
            return FetchedRate(rate=BASE_RATE, rate_date=day, source="BASE")
        for offset in range(EXCHANGE_RATE_LOOKBACK_DAYS + 1):
            candidate = day - timedelta(days=offset)
            cached = self.repository.find_rate(currency.pk, candidate, source)
            if cached is not None:
                return FetchedRate(rate=cached.rate, rate_date=candidate, source=source)
            if source != Source.VIETCOMBANK_TRANSFER_BUY:
                continue
            rate = self._fetch(currency, candidate)
            if rate is not None:
                return FetchedRate(rate=rate, rate_date=candidate, source=source)
        raise BusinessRuleError(
            f"Không có tỷ giá {currency.code} ngày {day:%d/%m/%Y}, hãy nhập tay.",
            code=CurrencyErrorCode.RATE_UNAVAILABLE,
        )

    def resolve_by_id(self, currency_id: Any, day: date, source: str) -> FetchedRate:
        """`resolve` theo id tiền tệ (API tra cứu cho form)."""
        return self.resolve(self.currency_repository.get_by_id(currency_id), day, source)

    @transaction.atomic
    def refetch(self, actor: Any, currency_id: Any, day: date) -> ExchangeRate:
        """Lấy lại từ API cho đúng ngày (ghi đè dòng đệm cũ)."""
        currency = self.currency_repository.get_by_id(currency_id)
        rate = self._call_api(currency, day)
        if rate is None:
            raise BusinessRuleError(
                f"Vietcombank chưa có tỷ giá ngày {day:%d/%m/%Y}.", code=CurrencyErrorCode.RATE_UNAVAILABLE
            )
        existing = self.repository.find_rate(currency.pk, day, Source.VIETCOMBANK_TRANSFER_BUY)
        if existing is not None:
            return self.repository.update(existing, actor=actor, rate=rate, fetched_at=timezone.now())
        return self.repository.create(
            actor=actor,
            currency=currency,
            rate_date=day,
            rate=rate,
            source=Source.VIETCOMBANK_TRANSFER_BUY,
            fetched_at=timezone.now(),
        )

    # ------------------------------------------------------------------ CRUD tay
    def create(self, actor: Any, data: dict[str, Any]) -> ExchangeRate:
        """Chỉ tạo dòng MANUAL cho ngoại tệ."""
        currency = self.currency_repository.get_by_id(data["currency_id"])
        if currency.is_base:
            raise BusinessRuleError("Tiền tệ gốc không cần tỷ giá.", code=CurrencyErrorCode.BASE_LOCKED)
        return super().create(actor, {**data, "source": Source.MANUAL})

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> ExchangeRate:
        """Chỉ sửa dòng MANUAL."""
        self._ensure_manual(pk)
        return super().update(actor, pk, data)

    def delete(self, actor: Any, pk: Any) -> None:
        """Chỉ xóa dòng MANUAL."""
        self._ensure_manual(pk)
        super().delete(actor, pk)

    # ------------------------------------------------------------------ nội bộ
    def _ensure_manual(self, pk: Any) -> None:
        if self.repository.get_by_id(pk).source != Source.MANUAL:
            raise BusinessRuleError("Tỷ giá lấy từ API chỉ đọc.", code=CurrencyErrorCode.RATE_READ_ONLY)

    def _fetch(self, currency: Currency, day: date) -> Decimal | None:
        """Gọi API rồi lưu đệm (dữ liệu công khai, không gắn người dùng)."""
        rate = self._call_api(currency, day)
        if rate is None:
            return None
        # Request khác vừa lưu cùng ngày (ConflictError): bỏ qua, dùng giá trị vừa lấy.
        with contextlib.suppress(ConflictError):
            self.repository.create(
                currency=currency,
                rate_date=day,
                rate=rate,
                source=Source.VIETCOMBANK_TRANSFER_BUY,
                fetched_at=timezone.now(),
            )
        return rate

    def _call_api(self, currency: Currency, day: date) -> Decimal | None:
        try:
            return self.client.transfer_buy_rate(currency.code, day)
        except (requests.RequestException, ValueError) as exc:
            logger.warning(
                "Không lấy được tỷ giá Vietcombank %s %s: %s", currency.code, day, type(exc).__name__
            )
            raise BusinessRuleError(
                "Không lấy được tỷ giá tự động, hãy nhập tay.", code=CurrencyErrorCode.RATE_UNAVAILABLE
            ) from exc
