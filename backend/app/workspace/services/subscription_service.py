"""Nghiệp vụ Dịch vụ định kỳ & Gia hạn (tính anchor_day, tỷ giá theo paid_on, tạo payment)."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.system.models.attachment import Attachment
from app.system.services.attachment_service import AttachmentService
from app.workspace.constants.workspace_defaults import AI_TOOL_ITEM_LIMIT
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.models.subscription import Subscription
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.subscription_permission import SubscriptionPermission
from app.workspace.repositories.subscription_payment_repository import SubscriptionPaymentRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_exchange_service import WorkspaceExchangeService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService
from app.workspace.utils.date_math import add_months_clamped


class SubscriptionService(CoreCrudService[Subscription, SubscriptionRepository]):
    """Quản lý gói đăng ký định kỳ và thao tác gia hạn tạo lịch sử thanh toán."""

    repository_class = SubscriptionRepository
    owner_field = "owner"
    manage_all_permission = SubscriptionPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: SubscriptionRepository | None = None,
        payment_repository: SubscriptionPaymentRepository | None = None,
        exchange_service: WorkspaceExchangeService | None = None,
        attachment_service: AttachmentService | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        setting_service: WorkspaceSettingService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc repository thanh toán, tỷ giá, file đính kèm và lịch."""
        super().__init__(repository or SubscriptionRepository())
        self.payment_repository = payment_repository or SubscriptionPaymentRepository()
        self.exchange_service = exchange_service or WorkspaceExchangeService()
        self.attachment_service = attachment_service or AttachmentService()
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService()
        self.setting_service = setting_service or WorkspaceSettingService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Subscription:
        """Tạo dịch vụ định kỳ mới kèm anchor_day & quy đổi VNĐ."""
        payload = dict(data)
        self._validate_cycle(
            payload.get("billing_cycle", Subscription.BillingCycle.MONTHLY),
            payload.get("custom_cycle_days"),
        )
        renew_date: date = payload["renew_date"]
        if not payload.get("anchor_day"):
            payload["anchor_day"] = renew_date.day

        rate_date = min(renew_date, timezone.localdate())
        explicit_rate = payload.pop("exchange_rate", None)
        currency, rounded_amount, rate, amount_vnd = self.exchange_service.resolve_amount_vnd(
            payload.pop("currency_id"),
            payload["amount"],
            rate_date,
            explicit_rate=explicit_rate,
        )
        payload["currency"] = currency
        payload["amount"] = rounded_amount
        payload["exchange_rate"] = rate
        payload["amount_vnd"] = amount_vnd

        subscription = super().create(actor, payload)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return subscription

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Subscription:
        """Cập nhật dịch vụ định kỳ và làm mới mốc cảnh báo W4."""
        subscription = self.get_for_write(actor, pk)
        payload = dict(data)

        cycle = payload.get("billing_cycle", subscription.billing_cycle)
        custom_days = payload.get("custom_cycle_days", subscription.custom_cycle_days)
        self._validate_cycle(cycle, custom_days)
        if cycle != Subscription.BillingCycle.CUSTOM_DAYS and "billing_cycle" in payload:
            payload.setdefault("custom_cycle_days", None)

        if {"currency_id", "amount", "exchange_rate"} & set(payload):
            currency_id = payload.pop("currency_id", subscription.currency_id)
            raw_amount = payload.get("amount", subscription.amount)
            renew_date = payload.get("renew_date", subscription.renew_date)
            rate_date = min(renew_date, timezone.localdate())
            if "exchange_rate" in payload:
                explicit_rate = payload.pop("exchange_rate")
            elif currency_id == subscription.currency_id:
                explicit_rate = subscription.exchange_rate
            else:
                explicit_rate = None

            currency, rounded_amount, rate, amount_vnd = self.exchange_service.resolve_amount_vnd(
                currency_id,
                raw_amount,
                rate_date,
                explicit_rate=explicit_rate,
            )
            payload["currency"] = currency
            payload["amount"] = rounded_amount
            payload["exchange_rate"] = rate
            payload["amount_vnd"] = amount_vnd

        updated = self.repository.update(subscription, actor=actor, **payload)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return updated

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm dịch vụ định kỳ và cập nhật mốc cảnh báo."""
        super().delete(actor, pk)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()

    @transaction.atomic
    def renew(self, actor: Any, pk: Any, data: dict[str, Any]) -> SubscriptionPayment:
        """Ghi nhận thanh toán gia hạn: luôn tra tỷ giá <= `paid_on`, đẩy `renew_date` theo `anchor_day`."""
        subscription = self.get_for_write(actor, pk)
        owner = subscription.owner
        setting = self.setting_service.get_or_create_for_owner(owner)
        today_local = self.tz_service.local_today(setting.timezone)

        paid_on = data.get("paid_on") or today_local
        amount_override = data.get("amount")
        raw_amount: Decimal = (
            Decimal(str(amount_override)) if amount_override is not None else subscription.amount
        )
        explicit_rate = data.get("exchange_rate")

        # Quy tắc: nếu ngoại tệ mà không gửi exchange_rate, bắt buộc tra <= paid_on (không dùng rate cũ).
        currency, rounded_amount, rate, amount_vnd = self.exchange_service.resolve_amount_vnd(
            subscription.currency_id,
            raw_amount,
            paid_on,
            explicit_rate=explicit_rate,
        )

        advance_from = data.get("advance_from") or "cycle"
        period_from = subscription.renew_date if advance_from == "cycle" else paid_on
        anchor_day = subscription.anchor_day or period_from.day
        period_to = self._compute_next_renew_date(
            period_from,
            subscription.billing_cycle,
            subscription.custom_cycle_days,
            anchor_day,
        )

        receipt_id = data.get("receipt_attachment_id")
        receipt_attachment = (
            self.attachment_service.set_visibility(actor, receipt_id, Attachment.Visibility.PRIVATE)
            if receipt_id
            else None
        )

        payment = self.payment_repository.create(
            actor=actor,
            owner=owner,
            subscription=subscription,
            paid_on=paid_on,
            period_from=period_from,
            period_to=period_to,
            amount=rounded_amount,
            currency=currency,
            exchange_rate=rate,
            amount_vnd=amount_vnd,
            payment_method=data.get("payment_method") or subscription.payment_method,
            receipt_attachment=receipt_attachment,
            note=data.get("note", ""),
        )

        # Cập nhật mốc renew_date mới & ước tính VNĐ gần nhất (giữ nguyên giá gốc).
        _, _, _, projected_vnd = self.exchange_service.resolve_amount_vnd(
            subscription.currency_id,
            subscription.amount,
            paid_on,
            explicit_rate=rate,
        )
        self.repository.update(
            subscription,
            actor=actor,
            renew_date=period_to,
            exchange_rate=rate,
            amount_vnd=projected_vnd,
        )
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return payment

    def get_upcoming(self, actor: Any, *, days_ahead: int = 14) -> tuple[list[Subscription], int]:
        """Lấy gói sắp tới hạn của chính `actor` cho AI Tool (tối đa 15 mục)."""
        setting = self.setting_service.get_or_create_for_owner(actor)
        today_local = self.tz_service.local_today(setting.timezone)
        safe_days = max(1, min(int(days_ahead), 90))
        return self.repository.list_upcoming_for_owner(
            actor.pk,
            today_local,
            today_local + timedelta(days=safe_days),
            limit=AI_TOOL_ITEM_LIMIT,
        )

    def _validate_cycle(self, billing_cycle: str, custom_cycle_days: int | None) -> None:
        if billing_cycle == Subscription.BillingCycle.CUSTOM_DAYS and (
            not custom_cycle_days or int(custom_cycle_days) <= 0
        ):
            raise ValidationError(
                "Vui lòng nhập số ngày chu kỳ > 0.",
                code=WorkspaceErrorCode.CUSTOM_CYCLE_DAYS_REQUIRED,
                details={"custom_cycle_days": ["Bắt buộc lớn hơn 0 khi chọn chu kỳ tùy chỉnh."]},
            )

    def _compute_next_renew_date(
        self,
        start_date: date,
        billing_cycle: str,
        custom_cycle_days: int | None,
        anchor_day: int,
    ) -> date:
        if billing_cycle == Subscription.BillingCycle.WEEKLY:
            return start_date + timedelta(days=7)
        if billing_cycle == Subscription.BillingCycle.MONTHLY:
            return add_months_clamped(start_date, 1, anchor_day=anchor_day)
        if billing_cycle == Subscription.BillingCycle.QUARTERLY:
            return add_months_clamped(start_date, 3, anchor_day=anchor_day)
        if billing_cycle == Subscription.BillingCycle.SEMI_ANNUAL:
            return add_months_clamped(start_date, 6, anchor_day=anchor_day)
        if billing_cycle == Subscription.BillingCycle.YEARLY:
            return add_months_clamped(start_date, 12, anchor_day=anchor_day)
        return start_date + timedelta(days=max(1, int(custom_cycle_days or 30)))
