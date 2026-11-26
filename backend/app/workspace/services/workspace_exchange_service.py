"""Dịch vụ quy đổi tỷ giá & tiền tệ VNĐ dùng chung trong Workspace."""

from datetime import date
from decimal import Decimal
from typing import Any

from app.core.constants.defaults import DEFAULT_CURRENCY_CODE
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.validation_error import ValidationError
from app.finance.services.currency_converter import CurrencyConverter
from app.system.constants.currency_error_code import CurrencyErrorCode
from app.system.models.currency import Currency
from app.system.models.exchange_rate import ExchangeRate
from app.system.services.currency_service import CurrencyService
from app.system.services.exchange_rate_service import ExchangeRateService
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode


class WorkspaceExchangeService:
    """Quy đổi tiền tệ có kiểm tra tỷ giá chặt chẽ (tuyệt đối không fallback rate=1 cho ngoại tệ)."""

    def __init__(
        self,
        currency_service: CurrencyService | None = None,
        exchange_rate_service: ExchangeRateService | None = None,
        converter: CurrencyConverter | None = None,
    ) -> None:
        """Khởi tạo service tiền tệ, tỷ giá và bộ làm tròn Decimal."""
        self.currency_service = currency_service or CurrencyService()
        self.exchange_rate_service = exchange_rate_service or ExchangeRateService()
        self.converter = converter or CurrencyConverter()

    def resolve_amount_vnd(
        self,
        currency_id: Any,
        raw_amount: Decimal | str | int | float,
        rate_date: date,
        *,
        explicit_rate: Decimal | str | int | float | None = None,
    ) -> tuple[Currency, Decimal, Decimal, Decimal]:
        """Kiểm tra tiền tệ, làm tròn nguyên tệ, tra tỷ giá <= `rate_date` và tính số VNĐ.

        Raises:
            ValidationError: `WORKSPACE_EXCHANGE_RATE_INVALID` nếu `explicit_rate <= 0`,
                hoặc `WORKSPACE_CURRENCY_RATE_REQUIRED` nếu ngoại tệ chưa có tỷ giá tham chiếu.
        """
        currency = self.currency_service.get_active(currency_id)
        rounded_amount = self.converter.round_original(Decimal(str(raw_amount)), currency.decimal_places)

        if currency.is_base or currency.code == DEFAULT_CURRENCY_CODE:
            rate = Decimal("1")
            amount_vnd = self.converter.to_vnd(rounded_amount, rate)
            return currency, rounded_amount, rate, amount_vnd

        if explicit_rate is not None:
            rate = Decimal(str(explicit_rate))
            if rate <= Decimal("0"):
                raise ValidationError(
                    "Tỷ giá quy đổi phải lớn hơn 0.",
                    code=WorkspaceErrorCode.EXCHANGE_RATE_INVALID,
                    details={"exchange_rate": ["Tỷ giá quy đổi phải lớn hơn 0."]},
                )
        else:
            try:
                fetched = self.exchange_rate_service.resolve(currency, rate_date)
            except BusinessRuleError as exc:
                if exc.code != CurrencyErrorCode.RATE_UNAVAILABLE:
                    raise
                try:
                    fetched = self.exchange_rate_service.resolve(
                        currency, rate_date, source=ExchangeRate.Source.MANUAL
                    )
                except BusinessRuleError as manual_exc:
                    if manual_exc.code == CurrencyErrorCode.RATE_UNAVAILABLE:
                        raise ValidationError(
                            "Chưa có tỷ giá cho ngày chứng từ, vui lòng nhập tỷ giá lớn hơn 0.",
                            code=WorkspaceErrorCode.CURRENCY_RATE_REQUIRED,
                            details={
                                "exchange_rate": [
                                    "Chưa có tỷ giá cho ngày chứng từ, vui lòng nhập tỷ giá > 0."
                                ]
                            },
                        ) from manual_exc
                    raise
            rate = fetched.rate

        amount_vnd = self.converter.to_vnd(rounded_amount, rate)
        return currency, rounded_amount, rate, amount_vnd
