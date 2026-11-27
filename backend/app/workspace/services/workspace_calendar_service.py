"""Nghiệp vụ Lịch Tổng hợp 6 nguồn sự kiện trên Client Portal theo múi giờ hệ thống."""

from datetime import date
from decimal import Decimal
from typing import Any

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.finance.services.income_service import IncomeService
from app.system.services.user_service import UserService
from app.utilities.services.donation_transaction_service import DonationTransactionService
from app.workspace.constants.workspace_defaults import (
    ALLOWED_CALENDAR_TYPES,
    MAX_CALENDAR_RANGE_DAYS,
)
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.permissions.workspace_calendar_permission import WorkspaceCalendarPermission
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.repositories.asset_warranty_claim_repository import AssetWarrantyClaimRepository
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository


class WorkspaceCalendarService:
    """Gom 6 loại sự kiện (dịch vụ, nhắc việc, bảo hành TB, phiếu sửa, tiền vào, donate)."""

    def __init__(
        self,
        user_service: UserService | None = None,
        income_service: IncomeService | None = None,
        donation_service: DonationTransactionService | None = None,
        subscription_repository: SubscriptionRepository | None = None,
        reminder_repository: ReminderRepository | None = None,
        asset_repository: AssetRepository | None = None,
        claim_repository: AssetWarrantyClaimRepository | None = None,
    ) -> None:
        """Khởi tạo các repository/service nguồn sự kiện."""
        self.user_service = user_service or UserService()
        self.income_service = income_service or IncomeService()
        self.donation_service = donation_service or DonationTransactionService()
        self.subscription_repository = subscription_repository or SubscriptionRepository()
        self.reminder_repository = reminder_repository or ReminderRepository()
        self.asset_repository = asset_repository or AssetRepository()
        self.claim_repository = claim_repository or AssetWarrantyClaimRepository()

    def events(
        self,
        actor: Any,
        *,
        from_date: date,
        to_date: date,
        types: list[str] | None = None,
        target_owner_id: Any | None = None,
    ) -> dict[str, Any]:
        """Trả danh sách sự kiện hợp nhất trong khoảng ngày `<= 93` ngày."""
        if to_date < from_date:
            raise ValidationError(
                "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
                details={"to": ["Ngày kết thúc không được nhỏ hơn ngày bắt đầu."]},
            )
        if (to_date - from_date).days > MAX_CALENDAR_RANGE_DAYS:
            raise ValidationError(
                f"Khoảng thời gian xem lịch tối đa {MAX_CALENDAR_RANGE_DAYS} ngày.",
                code=WorkspaceErrorCode.CALENDAR_RANGE_TOO_LONG,
                details={"to": [f"Khoảng ngày không được vượt quá {MAX_CALENDAR_RANGE_DAYS} ngày."]},
            )

        selected_types = self._resolve_types(types)

        target_owner = actor
        if (
            target_owner_id
            and str(target_owner_id) != str(actor.pk)
            and actor.has_perm(WorkspaceCalendarPermission.MANAGE_ALL.code)
        ):
            found = self.user_service.find_by_id(target_owner_id)
            if found is None:
                raise NotFoundError()
            target_owner = found

        items: list[dict[str, Any]] = []

        if "subscription" in selected_types:
            subs, _ = self.subscription_repository.list_upcoming_for_owner(
                target_owner.pk, from_date, to_date
            )
            for sub in subs:
                items.append(
                    {
                        "id": f"sub:{sub.pk}:{sub.renew_date.isoformat()}",
                        "source_id": str(sub.pk),
                        "type": "subscription",
                        "date": sub.renew_date,
                        "time": "",
                        "title": sub.name,
                        "subtitle": sub.provider or sub.get_category_display(),
                        "status": sub.billing_cycle,
                        "amount_vnd": Decimal(sub.amount_vnd),
                        "is_completed": False,
                        "link": f"/portal/subscriptions/{sub.pk}",
                    }
                )

        if "reminder" in selected_types:
            reminders = self.reminder_repository.list_between(target_owner.pk, from_date, to_date)
            for rem in reminders:
                items.append(
                    {
                        "id": f"rem:{rem.pk}:{rem.due_date.isoformat()}",
                        "source_id": str(rem.pk),
                        "type": "reminder",
                        "date": rem.due_date,
                        "time": rem.due_time.strftime("%H:%M") if rem.due_time else "",
                        "title": rem.title,
                        "subtitle": rem.get_priority_display(),
                        "status": "COMPLETED" if rem.is_completed else rem.priority,
                        "amount_vnd": None,
                        "is_completed": bool(rem.is_completed),
                        "link": f"/portal/reminders/{rem.pk}",
                    }
                )

        if "asset_warranty" in selected_types:
            assets = self.asset_repository.list_with_warranty_between(target_owner.pk, from_date, to_date)
            for asset in assets:
                if asset.warranty_end_date is None:
                    continue
                items.append(
                    {
                        "id": f"war:{asset.pk}:{asset.warranty_end_date.isoformat()}",
                        "source_id": str(asset.pk),
                        "type": "asset_warranty",
                        "date": asset.warranty_end_date,
                        "time": "",
                        "title": f"Hết BH: {asset.name}",
                        "subtitle": asset.warranty_provider or asset.brand,
                        "status": asset.status,
                        "amount_vnd": None,
                        "is_completed": False,
                        "link": f"/portal/assets/{asset.pk}",
                    }
                )

        if "warranty_claim" in selected_types:
            claims = self.claim_repository.list_calendar_events(target_owner.pk, from_date, to_date)
            for claim in claims:
                if claim.estimated_return_date and from_date <= claim.estimated_return_date <= to_date:
                    items.append(
                        {
                            "id": f"claim-ret:{claim.pk}:{claim.estimated_return_date.isoformat()}",
                            "source_id": str(claim.pk),
                            "type": "warranty_claim",
                            "date": claim.estimated_return_date,
                            "time": "",
                            "title": f"Hẹn trả BH ({claim.claim_code}): {claim.asset.name}",
                            "subtitle": claim.service_center,
                            "status": claim.status,
                            "amount_vnd": Decimal(claim.cost_vnd) if claim.cost_vnd else None,
                            "is_completed": False,
                            "link": f"/portal/warranty-claims/{claim.pk}",
                        }
                    )
                if claim.part_warranty_end_date and from_date <= claim.part_warranty_end_date <= to_date:
                    items.append(
                        {
                            "id": f"claim-part:{claim.pk}:{claim.part_warranty_end_date.isoformat()}",
                            "source_id": str(claim.pk),
                            "type": "warranty_claim",
                            "date": claim.part_warranty_end_date,
                            "time": "",
                            "title": f"Hết BH linh kiện ({claim.claim_code}): {claim.asset.name}",
                            "subtitle": claim.service_center,
                            "status": claim.status,
                            "amount_vnd": None,
                            "is_completed": False,
                            "link": f"/portal/warranty-claims/{claim.pk}",
                        }
                    )

        if "income" in selected_types:
            items.extend(self.income_service.list_calendar_items(target_owner.pk, from_date, to_date))

        if "donation" in selected_types:
            items.extend(self.donation_service.list_calendar_items(target_owner.pk, from_date, to_date))

        items.sort(key=lambda item: (item["date"], item["time"], item["type"], item["title"]))
        return {
            "timezone": DEFAULT_TIMEZONE,
            "from_date": from_date,
            "to_date": to_date,
            "events": items,
        }

    def _resolve_types(self, raw_types: list[str] | None) -> set[str]:
        if not raw_types:
            return set(ALLOWED_CALENDAR_TYPES)
        cleaned: set[str] = set()
        for entry in raw_types:
            for part in str(entry).split(","):
                name = part.strip()
                if not name:
                    continue
                if name not in ALLOWED_CALENDAR_TYPES:
                    raise ValidationError(
                        f"Loại sự kiện '{name}' không được hỗ trợ.",
                        details={"types": [f"Giá trị không hợp lệ: {name}."]},
                    )
                cleaned.add(name)
        return cleaned or set(ALLOWED_CALENDAR_TYPES)
