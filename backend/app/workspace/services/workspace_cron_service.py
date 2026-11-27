"""Động cơ Cron Serverless cho Workspace W4 (Nhắc việc, Bảo hành, Gia hạn & Daily Digest)."""

import hmac
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.utils import timezone as dj_timezone

from app.core.cache.cache_service import CacheService
from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.exceptions.not_found_error import NotFoundError
from app.system.constants.notification_defaults import NOTIFICATION_BULK_BATCH
from app.system.services.notification_service import NotificationService
from app.system.services.qstash_client import QstashClient
from app.system.services.user_service import UserService
from app.system.types.notification_payload import NotificationPayload
from app.workspace.constants.workspace_defaults import (
    ALERT_LOOKAHEAD_WINDOW_DAYS,
    CRON_BATCH_BUDGET_SECONDS,
    DEFAULT_DIGEST_SECTIONS,
    DEFAULT_DIGEST_TIME_SLOTS,
    DEFAULT_REMINDER_DAYS_BEFORE,
    DEFAULT_WARRANTY_ALERT_DAYS,
    DIGEST_WINDOW_SECONDS,
    DISPATCH_DUE_SKEW_SECONDS,
    REMINDER_BACKSTOP_WINDOW_SECONDS,
)
from app.workspace.constants.workspace_notification_event import WorkspaceNotificationEvent
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_spending_service import WorkspaceSpendingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

SIGNATURE_HEADER = "Upstash-Signature"


class WorkspaceCronService:
    """Chạy nền trên Serverless: Neon 0 CU khi rảnh, W4 quét theo mốc Redis & gửi theo cấu hình Hồ sơ."""

    def __init__(
        self,
        cache_service: CacheService | None = None,
        qstash_client: QstashClient | None = None,
        notification_service: NotificationService | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        reminder_repository: ReminderRepository | None = None,
        asset_repository: AssetRepository | None = None,
        subscription_repository: SubscriptionRepository | None = None,
        config_service: AssistantConfigService | None = None,
        user_service: UserService | None = None,
        spending_service: WorkspaceSpendingService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc cache Redis, QStash, outbox notification và repository."""
        self.cache_service = cache_service or CacheService()
        self.qstash_client = qstash_client or QstashClient()
        self.notification_service = notification_service or NotificationService()
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService(
            cache_service=self.cache_service, qstash_client=self.qstash_client
        )
        self.reminder_repository = reminder_repository or ReminderRepository()
        self.asset_repository = asset_repository or AssetRepository()
        self.subscription_repository = subscription_repository or SubscriptionRepository()
        self.config_service = config_service or AssistantConfigService()
        self.user_service = user_service or UserService()
        self.spending_service = spending_service or WorkspaceSpendingService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    def authorize_request(self, headers: Any, body: bytes, path: str) -> str:
        """Kiểm tra `Upstash-Signature` hoặc `Authorization: Bearer <CRON_SECRET>`, sai → `NotFoundError`."""
        signature = str(headers.get(SIGNATURE_HEADER, "") or "").strip()
        if signature:
            if not self.qstash_client.verify(signature, body, path):
                raise NotFoundError()
            return "qstash"

        secret = str(settings.CRON_SECRET or "").strip()
        provided = str(headers.get("Authorization", "") or "").removeprefix("Bearer ").strip()
        if not secret or not hmac.compare_digest(provided, secret):
            raise NotFoundError()
        return "cron"

    def run_tick(self, *, run_w4: bool = True, force_w4: bool = False) -> dict[str, Any]:
        """Thực thi W4 (Nhắc việc/Bảo hành/Gia hạn/Digest) và gọi `flush_kick()` đúng 1 lần."""
        now = dj_timezone.now()
        w4_stats = (
            self._run_w4_alerts(now, force=force_w4)
            if run_w4
            else {"ran": False, "db_touched": False, "notifications": 0}
        )
        total_notifications = int(w4_stats["notifications"])
        kicked = self.notification_service.flush_kick() if total_notifications > 0 else False

        return {
            "w4_ran": bool(w4_stats["ran"]),
            "w4_db_touched": bool(w4_stats["db_touched"]),
            "notifications_queued": total_notifications,
            "kicked": kicked,
        }

    def refresh_cron_schedules(self) -> int:
        """Đồng bộ lại lịch W4/QStash mỗi ngày khi chạy cleanup 03:00 UTC."""
        if self.cache_service.enabled or self.qstash_client.is_configured():
            return self.alerts_cache_service.refresh_alerts_next_due()
        return 0

    # ==================================================================
    # W4: Reminders, Warranties, Subscriptions, Daily Digest
    # ==================================================================
    def _run_w4_alerts(self, now: datetime, *, force: bool = False) -> dict[str, Any]:
        stats: dict[str, Any] = {"ran": False, "db_touched": False, "notifications": 0}
        now_ts = int(now.timestamp())

        if self.cache_service.enabled:
            next_due = self.alerts_cache_service.read_alerts_next_due()
            if force:
                if next_due is not None and next_due > now_ts + DISPATCH_DUE_SKEW_SECONDS:
                    return stats
            else:
                if next_due is not None and next_due > now_ts:
                    return stats
                if next_due is None:
                    stats["db_touched"] = True
                    rewarmed = self.alerts_cache_service.refresh_alerts_next_due(now=now)
                    if rewarmed > now_ts:
                        return stats

        if not self.alerts_cache_service.acquire_w4_lock():
            return stats

        try:
            stats["ran"] = True
            stats["db_touched"] = True
            admin_cfg = self.config_service.get_config()

            notified = 0
            notified += self._process_due_reminders(now)
            notified += self._process_expiring_warranties(now, admin_cfg)
            notified += self._process_renewing_subscriptions(now, admin_cfg)
            notified += self._process_daily_digests(now, admin_cfg)

            self.alerts_cache_service.refresh_alerts_next_due(now=now)
            stats["notifications"] = notified
            return stats
        finally:
            self.alerts_cache_service.release_w4_lock()

    def _process_due_reminders(self, now: datetime) -> int:
        sent = 0
        start_date = (now - timedelta(seconds=REMINDER_BACKSTOP_WINDOW_SECONDS) - timedelta(days=1)).date()
        end_date = now.date() + timedelta(days=ALERT_LOOKAHEAD_WINDOW_DAYS + 1)
        pending = self.reminder_repository.list_all_pending_up_to(end_date, start_date=start_date)
        local_today = self.tz_service.local_today(DEFAULT_TIMEZONE, now=now)
        for reminder in pending:
            due_time = reminder.due_time or self.tz_service.parse_hhmm("08:00")
            if due_time is not None:
                trigger_utc = self.tz_service.local_to_utc(reminder.due_date, due_time, DEFAULT_TIMEZONE)
                trigger_utc -= timedelta(minutes=int(reminder.notify_minutes_before or 0))
                if trigger_utc <= now and reminder.due_date <= now.date() + timedelta(days=1):
                    schedule_key = self.alerts_cache_service.reminder_schedule_key(reminder)
                    sent += self.notification_service.notify(
                        WorkspaceNotificationEvent.REMINDER_DUE,
                        dedup_key=f"rem:{reminder.pk}:{schedule_key}",
                        recipient=reminder.owner,
                        payload=NotificationPayload(
                            title=f"Nhắc việc: {reminder.title}",
                            body=reminder.description or f"Đến hạn ngày {reminder.due_date:%d/%m/%Y}.",
                            link="/portal/reminders",
                            message_key="workspace.notifications.reminderDue",
                            params={"title": reminder.title},
                            details=(
                                ("📅 Ngày", f"{reminder.due_date:%d/%m/%Y}"),
                                (
                                    "⏰ Giờ",
                                    reminder.due_time.strftime("%H:%M") if reminder.due_time else "Cả ngày",
                                ),
                                ("🔖 Ưu tiên", reminder.get_priority_display()),
                            ),
                        ),
                        kick=False,
                    )
                    self.alerts_cache_service.mark_reminder_notified(reminder.pk, schedule_key)

            days_left = (reminder.due_date - local_today).days
            rem_days = reminder.reminder_days_before or []
            if days_left > 0 and days_left in rem_days:
                dedup_key = f"rem_day:{reminder.pk}:{reminder.due_date.isoformat()}:{days_left}"
                sent += self.notification_service.notify(
                    WorkspaceNotificationEvent.REMINDER_DUE,
                    dedup_key=dedup_key,
                    recipient=reminder.owner,
                    payload=NotificationPayload(
                        title=f"Sắp đến hạn ({days_left} ngày): {reminder.title}",
                        body=reminder.description
                        or f"Công việc sẽ đến hạn ngày {reminder.due_date:%d/%m/%Y}.",
                        link="/portal/reminders",
                        message_key="workspace.notifications.reminderDue",
                        params={"title": reminder.title},
                        details=(
                            ("📅 Ngày đến hạn", f"{reminder.due_date:%d/%m/%Y}"),
                            ("⏳ Còn lại", f"{days_left} ngày"),
                            ("🔖 Ưu tiên", reminder.get_priority_display()),
                        ),
                    ),
                    kick=False,
                )
                self.alerts_cache_service.mark_alert_notified(dedup_key)
        return sent

    def _process_expiring_warranties(self, now: datetime, admin_cfg: dict[str, Any]) -> int:
        sent = 0
        thresholds = admin_cfg.get("warranty_alert_days") or list(DEFAULT_WARRANTY_ALERT_DAYS)
        local_today = self.tz_service.local_today(DEFAULT_TIMEZONE, now=now)
        assets = self.asset_repository.list_all_warranty_expiring_between(
            now.date() - timedelta(days=1), now.date() + timedelta(days=ALERT_LOOKAHEAD_WINDOW_DAYS + 1)
        )
        for asset in assets:
            if asset.warranty_end_date is None:
                continue
            days_left = (asset.warranty_end_date - local_today).days
            if days_left not in thresholds:
                continue

            dedup_key = f"war:{asset.pk}:{asset.warranty_end_date.isoformat()}:{days_left}"
            sent += self.notification_service.notify(
                WorkspaceNotificationEvent.WARRANTY_EXPIRING,
                dedup_key=dedup_key,
                recipient=asset.owner,
                payload=NotificationPayload(
                    title=f"{asset.name} còn {days_left} ngày bảo hành",
                    body=(
                        f"Hết hạn ngày {asset.warranty_end_date:%d/%m/%Y} "
                        f"tại {asset.warranty_provider or asset.purchase_store or '-'}."
                    ),
                    link=f"/portal/assets/{asset.pk}",
                    message_key="workspace.notifications.warrantyExpiring",
                    params={"name": asset.name, "days_left": days_left},
                    details=(
                        ("💻 Thiết bị", asset.name),
                        ("📅 Hết bảo hành", f"{asset.warranty_end_date:%d/%m/%Y}"),
                        ("🏪 Nơi mua", asset.purchase_store or "-"),
                    ),
                ),
                kick=False,
            )
            self.alerts_cache_service.mark_alert_notified(dedup_key)
        return sent

    def _process_renewing_subscriptions(self, now: datetime, admin_cfg: dict[str, Any]) -> int:
        sent = 0
        default_thresholds = admin_cfg.get("subscription_default_alert_days") or list(
            DEFAULT_REMINDER_DAYS_BEFORE
        )
        local_today = self.tz_service.local_today(DEFAULT_TIMEZONE, now=now)
        subs = self.subscription_repository.list_all_active_upcoming(
            now.date() + timedelta(days=ALERT_LOOKAHEAD_WINDOW_DAYS + 1),
            start_date=now.date() - timedelta(days=1),
        )
        for sub in subs:
            days_left = (sub.renew_date - local_today).days
            thresholds = sub.reminder_days_before or default_thresholds
            if days_left not in thresholds:
                continue

            amount_text = f"{int(Decimal(sub.amount_vnd)):,} đ".replace(",", ".")
            dedup_key = f"sub:{sub.pk}:{sub.renew_date.isoformat()}:{days_left}"
            sent += self.notification_service.notify(
                WorkspaceNotificationEvent.SUBSCRIPTION_RENEWING,
                dedup_key=dedup_key,
                recipient=sub.owner,
                payload=NotificationPayload(
                    title=f"{sub.name} sắp gia hạn ({days_left} ngày)",
                    body=f"Chi phí dự kiến {amount_text} vào {sub.renew_date:%d/%m/%Y}.",
                    link=f"/portal/subscriptions/{sub.pk}",
                    message_key="workspace.notifications.subscriptionRenewing",
                    params={"name": sub.name, "days_left": days_left},
                    details=(
                        ("💳 Dịch vụ", sub.name),
                        ("📅 Ngày gia hạn", f"{sub.renew_date:%d/%m/%Y}"),
                        ("💰 Dự kiến", amount_text),
                    ),
                ),
                kick=False,
            )
            self.alerts_cache_service.mark_alert_notified(dedup_key)
        return sent

    def _process_daily_digests(self, now: datetime, admin_cfg: dict[str, Any]) -> int:
        sent = 0
        slots = admin_cfg.get("digest_time_slots") or list(DEFAULT_DIGEST_TIME_SLOTS)
        sections = admin_cfg.get("digest_sections") or list(DEFAULT_DIGEST_SECTIONS)
        active_users = self.user_service.list_active()
        if not active_users or not slots:
            return 0

        local_today = self.tz_service.local_today(DEFAULT_TIMEZONE, now=now)
        deadline = time.monotonic() + CRON_BATCH_BUDGET_SECONDS
        for start in range(0, len(active_users), NOTIFICATION_BULK_BATCH):
            batch_users = active_users[start : start + NOTIFICATION_BULK_BATCH]
            for owner in batch_users:
                if time.monotonic() >= deadline:
                    return sent
                for offset in (-1, 0):
                    target_day = local_today + timedelta(days=offset)
                    date_str = target_day.isoformat()
                    for raw_slot in slots:
                        slot = str(raw_slot).strip()
                        parsed = self.tz_service.parse_hhmm(slot)
                        if parsed is None:
                            continue
                        slot_utc = self.tz_service.local_to_utc(target_day, parsed, DEFAULT_TIMEZONE)
                        elapsed = (now - slot_utc).total_seconds()
                        if elapsed < 0 or elapsed > DIGEST_WINDOW_SECONDS:
                            continue
                        if not self.alerts_cache_service.acquire_digest_slot_lock(owner.pk, date_str, slot):
                            continue

                        payload = self._build_digest_payload(owner, sections, target_day, slot)
                        sent += self.notification_service.notify(
                            WorkspaceNotificationEvent.DIGEST_DAILY,
                            dedup_key=f"digest:{owner.pk}:{date_str}:{slot}",
                            recipient=owner,
                            payload=payload,
                            kick=False,
                        )
        return sent

    def _build_digest_payload(
        self, owner: Any, sections: list[str], local_today: Any, slot: str
    ) -> NotificationPayload:
        details: list[tuple[str, str]] = []
        summary_parts: list[str] = []

        if "reminders" in sections:
            _, today_count = self.reminder_repository.list_pending_between(
                owner.pk, start_date=local_today, end_date=local_today, limit=1
            )
            _, overdue_count = self.reminder_repository.list_pending_between(
                owner.pk, end_date=local_today - timedelta(days=1), limit=1
            )
            details.append(("⏰ Nhắc việc", f"{today_count} việc hôm nay ({overdue_count} quá hạn)"))
            summary_parts.append(f"{today_count} nhắc việc hôm nay")

        if "warranty" in sections:
            war_count = self.asset_repository.count_expiring_before(
                owner.pk, local_today, local_today + timedelta(days=30)
            )
            details.append(("🛡️ Bảo hành", f"{war_count} thiết bị sắp hết hạn trong 30 ngày"))

        if "subscriptions" in sections:
            subs, sub_count = self.subscription_repository.list_upcoming_for_owner(
                owner.pk, local_today, local_today + timedelta(days=14)
            )
            total_sub = int(sum((Decimal(item.amount_vnd) for item in subs), Decimal("0")))
            sub_money = f"{total_sub:,} đ".replace(",", ".")
            details.append(("💳 Gia hạn 14 ngày", f"{sub_count} gói ({sub_money})"))

        if "finance" in sections:
            spending = self.spending_service.summary(owner, owner=owner)
            spent_str = f"{int(Decimal(spending['total_spent_vnd'])):,} đ".replace(",", ".")
            details.append(("💰 Chi tiêu tháng", spent_str))

        return NotificationPayload(
            title=f"Bản tin ngày {local_today:%d/%m/%Y} ({slot})",
            body=" · ".join(summary_parts) or "Tổng hợp trạng thái công việc và tài chính cá nhân.",
            link="/portal",
            message_key="workspace.notifications.dailyDigest",
            params={"date": local_today.isoformat(), "slot": slot},
            details=tuple(details),
        )
