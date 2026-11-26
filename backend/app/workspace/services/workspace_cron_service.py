"""Động cơ Cron tách 2 đường Redis độc lập: W1 (Monitor Uptime) != W4 (Alerts/Digest)."""

import hmac
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.utils import timezone as dj_timezone

from app.core.cache.cache_service import CacheService
from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.exceptions.not_found_error import NotFoundError
from app.core.utils.safe_http_client import SafeHttpClient
from app.system.services.notification_service import NotificationService
from app.system.services.qstash_client import QstashClient
from app.system.types.notification_payload import NotificationPayload
from app.workspace.constants.workspace_defaults import (
    ALERT_LOOKAHEAD_WINDOW_DAYS,
    CRON_BATCH_BUDGET_SECONDS,
    DEFAULT_DIGEST_SECTIONS,
    DEFAULT_REMINDER_DAYS_BEFORE,
    DEFAULT_WARRANTY_ALERT_DAYS,
    DISPATCH_DUE_SKEW_SECONDS,
    MONITOR_BATCH_FLUSH_HOURS,
    MONITOR_MAX_WORKERS,
)
from app.workspace.constants.workspace_notification_event import WorkspaceNotificationEvent
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.repositories.monitor_incident_repository import MonitorIncidentRepository
from app.workspace.repositories.monitor_target_repository import MonitorTargetRepository
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository
from app.workspace.repositories.workspace_setting_repository import WorkspaceSettingRepository
from app.workspace.services.monitor_target_service import MonitorTargetService
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_spending_service import WorkspaceSpendingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

logger = logging.getLogger(__name__)
SIGNATURE_HEADER = "Upstash-Signature"
DIGEST_WINDOW_SECONDS = 1800


class WorkspaceCronService:
    """Chạy nền trên Serverless: Neon 0 CU khi rảnh, W1 ping bằng Redis, W4 kick QStash 1 lần cuối lượt."""

    def __init__(
        self,
        cache_service: CacheService | None = None,
        qstash_client: QstashClient | None = None,
        notification_service: NotificationService | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        monitor_service: MonitorTargetService | None = None,
        monitor_repository: MonitorTargetRepository | None = None,
        incident_repository: MonitorIncidentRepository | None = None,
        reminder_repository: ReminderRepository | None = None,
        asset_repository: AssetRepository | None = None,
        subscription_repository: SubscriptionRepository | None = None,
        setting_repository: WorkspaceSettingRepository | None = None,
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
        self.monitor_repository = monitor_repository or MonitorTargetRepository()
        self.incident_repository = incident_repository or MonitorIncidentRepository()
        self.monitor_service = monitor_service or MonitorTargetService(
            repository=self.monitor_repository,
            incident_repository=self.incident_repository,
            alerts_cache_service=self.alerts_cache_service,
            notification_service=self.notification_service,
        )
        self.reminder_repository = reminder_repository or ReminderRepository()
        self.asset_repository = asset_repository or AssetRepository()
        self.subscription_repository = subscription_repository or SubscriptionRepository()
        self.setting_repository = setting_repository or WorkspaceSettingRepository()
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

    def run_tick(self, *, run_w1: bool = True, run_w4: bool = True, force_w4: bool = False) -> dict[str, Any]:
        """Thực thi W1 (Monitor) và W4 (Alerts) độc lập, cuối lượt gọi `flush_kick()` đúng 1 lần."""
        now = dj_timezone.now()
        w1_stats = (
            self._run_w1_monitors(now)
            if run_w1
            else {"checked": 0, "flipped": 0, "flushed": 0, "db_touched": False, "notifications": 0}
        )
        w4_stats = (
            self._run_w4_alerts(now, force=force_w4)
            if run_w4
            else {"ran": False, "db_touched": False, "notifications": 0}
        )

        total_notifications = int(w1_stats["notifications"]) + int(w4_stats["notifications"])
        kicked = self.notification_service.flush_kick() if total_notifications > 0 else False

        return {
            "w1_checked": int(w1_stats["checked"]),
            "w1_flipped": int(w1_stats["flipped"]),
            "w1_flushed": int(w1_stats["flushed"]),
            "w1_db_touched": bool(w1_stats["db_touched"]),
            "w4_ran": bool(w4_stats["ran"]),
            "w4_db_touched": bool(w4_stats["db_touched"]),
            "notifications_queued": total_notifications,
            "kicked": kicked,
        }

    # ==================================================================
    # W1: Monitor Uptime Ping (Redis-only khi ổn định)
    # ==================================================================
    def _run_w1_monitors(self, now: datetime) -> dict[str, Any]:
        stats: dict[str, Any] = {
            "checked": 0,
            "flipped": 0,
            "flushed": 0,
            "db_touched": False,
            "notifications": 0,
        }
        if not self.alerts_cache_service.acquire_w1_lock():
            return stats

        try:
            redis_enabled = self.cache_service.enabled
            snapshots: list[dict[str, Any]] | None = None
            if redis_enabled:
                snapshots = self.alerts_cache_service.get_monitors_active()
                if snapshots is None:
                    snapshots = self.alerts_cache_service.sync_monitors_active()
                    stats["db_touched"] = True
            else:
                stats["db_touched"] = True
                snapshots = self._targets_to_snapshots(self.monitor_repository.list_active_targets())

            if not snapshots:
                return stats

            due_items = self._select_due_snapshots(snapshots, now)
            if not due_items:
                return stats

            probe_outputs = self._probe_parallel(due_items)
            stats["checked"] = len(probe_outputs)

            flush_cutoff = now - timedelta(hours=MONITOR_BATCH_FLUSH_HOURS)
            flip_items: list[tuple[dict[str, Any], dict[str, Any], MonitorTarget.Status]] = []
            batch_items: list[tuple[dict[str, Any], dict[str, Any], MonitorTarget.Status]] = []
            redis_updates: list[tuple[str, dict[str, Any], bool]] = []

            for snap, probe in probe_outputs:
                healthy = self.monitor_service.is_probe_healthy(int(snap["expected_status"]), probe)
                new_status = MonitorTarget.Status.HEALTHY if healthy else MonitorTarget.Status.DOWN
                prev_status = str(snap["last_status"])
                new_failures = 0 if healthy else int(snap.get("consecutive_failures") or 0) + 1

                is_flip = (
                    new_status == MonitorTarget.Status.DOWN and prev_status != MonitorTarget.Status.DOWN
                ) or (new_status == MonitorTarget.Status.HEALTHY and prev_status == MonitorTarget.Status.DOWN)
                last_flush = self._parse_dt(snap.get("last_db_flush_at") or snap.get("last_checked_at"))
                needs_flush = (not redis_enabled) or (last_flush is None) or (last_flush <= flush_cutoff)

                state_payload = {
                    "last_status": new_status,
                    "last_status_code": probe.get("status_code"),
                    "last_latency_ms": probe.get("latency_ms"),
                    "last_checked_at": now.isoformat(),
                    "consecutive_failures": new_failures,
                    "last_db_flush_at": (
                        now.isoformat() if (is_flip or needs_flush) else snap.get("last_db_flush_at")
                    ),
                }
                redis_updates.append((str(snap["id"]), state_payload, is_flip or needs_flush))
                if is_flip:
                    flip_items.append((snap, probe, new_status))
                elif needs_flush:
                    batch_items.append((snap, probe, new_status))

            if redis_enabled:
                for target_id, state_payload, _ in redis_updates:
                    self.alerts_cache_service.write_monitor_state(target_id, state_payload)

            if not flip_items and not batch_items:
                return stats

            stats["db_touched"] = True
            target_ids = [snap["id"] for snap, _, _ in [*flip_items, *batch_items]]
            targets_map = self.monitor_repository.list_by_ids(target_ids)
            flip_target_ids = [snap["id"] for snap, _, _ in flip_items]
            open_incidents = self.incident_repository.find_open_map(flip_target_ids)

            for snap, probe, _ in flip_items:
                target = targets_map.get(str(snap["id"]))
                if target is None:
                    continue
                prev_status = target.last_status
                target.last_status = str(snap["last_status"])
                updated, _ = self.monitor_service.apply_probe_result(
                    target,
                    probe,
                    checked_at=now,
                    open_incident=open_incidents.get(target.pk),
                    kick=False,
                )
                stats["flipped"] += 1
                if updated.last_status != prev_status or updated.last_status in (
                    MonitorTarget.Status.DOWN,
                    MonitorTarget.Status.HEALTHY,
                ):
                    stats["notifications"] += 1

            batch_targets: list[MonitorTarget] = []
            for snap, probe, batch_status in batch_items:
                target = targets_map.get(str(snap["id"]))
                if target is None:
                    continue
                target.last_status = batch_status
                target.last_status_code = probe.get("status_code")
                target.last_latency_ms = probe.get("latency_ms")
                target.last_checked_at = now
                target.consecutive_failures = (
                    0
                    if batch_status == MonitorTarget.Status.HEALTHY
                    else int(snap.get("consecutive_failures") or 0) + 1
                )
                target.updated_at = now
                batch_targets.append(target)

            if batch_targets:
                self.monitor_repository.bulk_update_states(batch_targets)
                stats["flushed"] = len(batch_targets)

            if redis_enabled:
                self.alerts_cache_service.sync_monitors_active()

            return stats
        finally:
            self.alerts_cache_service.release_w1_lock()

    def _targets_to_snapshots(self, targets: list[MonitorTarget]) -> list[dict[str, Any]]:
        return [
            {
                "id": str(target.pk),
                "owner_id": str(target.owner_id),
                "name": target.name,
                "url": target.url,
                "method": target.method,
                "expected_status": int(target.expected_status),
                "timeout_seconds": int(target.timeout_seconds),
                "check_interval_minutes": int(target.check_interval_minutes),
                "last_status": target.last_status,
                "last_status_code": target.last_status_code,
                "last_latency_ms": target.last_latency_ms,
                "last_checked_at": (target.last_checked_at.isoformat() if target.last_checked_at else None),
                "consecutive_failures": int(target.consecutive_failures),
            }
            for target in targets
        ]

    def _select_due_snapshots(self, snapshots: list[dict[str, Any]], now: datetime) -> list[dict[str, Any]]:
        due: list[tuple[datetime, dict[str, Any]]] = []
        epoch_min = datetime.min.replace(tzinfo=dj_timezone.get_default_timezone())
        for raw_snap in snapshots:
            snap = dict(raw_snap)
            if self.cache_service.enabled:
                state = self.alerts_cache_service.read_monitor_state(snap["id"])
                if state:
                    snap_dt = self._parse_dt(snap.get("last_checked_at"))
                    state_dt = self._parse_dt(state.get("last_checked_at"))
                    if state_dt and (snap_dt is None or state_dt >= snap_dt):
                        snap.update(state)
            last_checked = self._parse_dt(snap.get("last_checked_at"))
            interval = max(1, int(snap.get("check_interval_minutes") or 30))
            if last_checked is None or (now - last_checked) >= timedelta(minutes=interval):
                due.append((last_checked or epoch_min, snap))

        due.sort(key=lambda pair: pair[0])
        return [item for _, item in due]

    def _probe_parallel(self, due_items: list[dict[str, Any]]) -> list[tuple[dict[str, Any], dict[str, Any]]]:
        deadline = time.monotonic() + CRON_BATCH_BUDGET_SECONDS
        results: list[tuple[dict[str, Any], dict[str, Any]]] = []

        def _worker(item: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
            remaining = deadline - time.monotonic()
            if remaining <= 0.3:
                return item, {
                    "ok": False,
                    "status_code": None,
                    "latency_ms": 1,
                    "final_url": item["url"],
                    "error_message": "Hết ngân sách thời gian cron.",
                }
            timeout = min(float(item.get("timeout_seconds") or 4), remaining)
            # Mỗi worker thread tự tạo 1 SafeHttpClient() độc lập (requests.Session không thread-safe).
            client = SafeHttpClient()
            return item, client.probe(
                str(item["url"]),
                method=str(item.get("method") or "GET"),
                timeout=timeout,
            )

        workers = min(MONITOR_MAX_WORKERS, max(1, len(due_items)))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(_worker, item) for item in due_items]
            for future in as_completed(futures):
                results.append(future.result())
        return results

    # ==================================================================
    # W4: Reminders, Warranties, Subscriptions, Daily Digest (Độc lập W1)
    # ==================================================================
    def _run_w4_alerts(self, now: datetime, *, force: bool = False) -> dict[str, Any]:
        stats: dict[str, Any] = {"ran": False, "db_touched": False, "notifications": 0}
        now_ts = int(now.timestamp())

        if self.cache_service.enabled:
            next_due = self.alerts_cache_service.read_alerts_next_due()
            if force:
                # Kể cả lượt QStash dispatch-due: nếu Redis xác nhận mốc tới hạn còn ở tương lai xa
                # (do reminder bị hủy/dời lịch hoặc lượt khác đã xử lý xong), bỏ qua quét DB.
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
            all_settings = list(self.setting_repository.get_queryset())
            settings_by_owner = {item.owner_id: item for item in all_settings}

            notified = 0
            notified += self._process_due_reminders(now, settings_by_owner)
            notified += self._process_expiring_warranties(now, settings_by_owner)
            notified += self._process_renewing_subscriptions(now, settings_by_owner)
            notified += self._process_daily_digests(now, all_settings)

            self.alerts_cache_service.refresh_alerts_next_due(now=now)
            stats["notifications"] = notified
            return stats
        finally:
            self.alerts_cache_service.release_w4_lock()

    def _process_due_reminders(self, now: datetime, settings_by_owner: dict[Any, Any]) -> int:
        sent = 0
        pending = self.reminder_repository.list_all_pending_up_to(now.date() + timedelta(days=1))
        for reminder in pending:
            owner_setting = settings_by_owner.get(reminder.owner_id)
            tz_name = owner_setting.timezone if owner_setting else DEFAULT_TIMEZONE
            due_time = reminder.due_time or self.tz_service.parse_hhmm("08:00")
            if due_time is None:
                continue
            trigger_utc = self.tz_service.local_to_utc(reminder.due_date, due_time, tz_name)
            trigger_utc -= timedelta(minutes=int(reminder.notify_minutes_before or 0))
            if trigger_utc > now:
                continue

            sent += self.notification_service.notify(
                WorkspaceNotificationEvent.REMINDER_DUE,
                dedup_key=f"rem:{reminder.pk}:{reminder.due_date.isoformat()}",
                recipient=reminder.owner,
                payload=NotificationPayload(
                    title=f"Nhắc việc: {reminder.title}",
                    body=reminder.description or f"Đến hạn ngày {reminder.due_date:%d/%m/%Y}.",
                    link="/ca-nhan/nhac-viec",
                    message_key="workspace.notifications.reminderDue",
                    params={"title": reminder.title},
                    details=(
                        ("📅 Ngày", f"{reminder.due_date:%d/%m/%Y}"),
                        ("⏰ Giờ", reminder.due_time.strftime("%H:%M") if reminder.due_time else "Cả ngày"),
                        ("🔖 Ưu tiên", reminder.get_priority_display()),
                    ),
                ),
                kick=False,
            )
            self.alerts_cache_service.mark_reminder_notified(reminder.pk, reminder.due_date.isoformat())
        return sent

    def _process_expiring_warranties(self, now: datetime, settings_by_owner: dict[Any, Any]) -> int:
        sent = 0
        assets = self.asset_repository.list_all_warranty_expiring_between(
            now.date() - timedelta(days=1), now.date() + timedelta(days=ALERT_LOOKAHEAD_WINDOW_DAYS + 1)
        )
        for asset in assets:
            if asset.warranty_end_date is None:
                continue
            owner_setting = settings_by_owner.get(asset.owner_id)
            tz_name = owner_setting.timezone if owner_setting else DEFAULT_TIMEZONE
            local_today = self.tz_service.local_today(tz_name, now=now)
            days_left = (asset.warranty_end_date - local_today).days
            thresholds = owner_setting.warranty_alert_days if owner_setting else DEFAULT_WARRANTY_ALERT_DAYS
            if days_left not in (thresholds or DEFAULT_WARRANTY_ALERT_DAYS):
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
                    link=f"/ca-nhan/thiet-bi/{asset.pk}",
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

    def _process_renewing_subscriptions(self, now: datetime, settings_by_owner: dict[Any, Any]) -> int:
        sent = 0
        subs = self.subscription_repository.list_all_active_upcoming(
            now.date() + timedelta(days=ALERT_LOOKAHEAD_WINDOW_DAYS)
        )
        for sub in subs:
            owner_setting = settings_by_owner.get(sub.owner_id)
            tz_name = owner_setting.timezone if owner_setting else DEFAULT_TIMEZONE
            local_today = self.tz_service.local_today(tz_name, now=now)
            days_left = (sub.renew_date - local_today).days
            thresholds = sub.reminder_days_before or (
                owner_setting.subscription_default_alert_days
                if owner_setting
                else DEFAULT_REMINDER_DAYS_BEFORE
            )
            if days_left not in (thresholds or DEFAULT_REMINDER_DAYS_BEFORE):
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
                    link=f"/ca-nhan/dich-vu/{sub.pk}",
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

    def _process_daily_digests(self, now: datetime, all_settings: list[Any]) -> int:
        sent = 0
        for owner_setting in all_settings:
            if not owner_setting.daily_digest_enabled:
                continue
            tz_name = owner_setting.timezone or DEFAULT_TIMEZONE
            local_today = self.tz_service.local_today(tz_name, now=now)
            date_str = local_today.isoformat()
            slots = owner_setting.digest_time_slots or []
            for raw_slot in slots:
                slot = str(raw_slot).strip()
                parsed = self.tz_service.parse_hhmm(slot)
                if parsed is None:
                    continue
                slot_utc = self.tz_service.local_to_utc(local_today, parsed, tz_name)
                if slot_utc > now or (now - slot_utc).total_seconds() > DIGEST_WINDOW_SECONDS:
                    continue
                if not self.alerts_cache_service.acquire_digest_slot_lock(
                    owner_setting.owner_id, date_str, slot
                ):
                    continue

                payload = self._build_digest_payload(owner_setting, local_today, slot)
                sent += self.notification_service.notify(
                    WorkspaceNotificationEvent.DIGEST_DAILY,
                    dedup_key=f"digest:{owner_setting.owner_id}:{date_str}:{slot}",
                    recipient=owner_setting.owner,
                    payload=payload,
                    kick=False,
                )
        return sent

    def _build_digest_payload(self, owner_setting: Any, local_today: Any, slot: str) -> NotificationPayload:
        sections = owner_setting.digest_sections or list(DEFAULT_DIGEST_SECTIONS)
        owner = owner_setting.owner
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

        if "monitors" in sections:
            monitors, total_mon = self.monitor_repository.list_for_owner(owner.pk, limit=200)
            down_count = sum(
                1
                for m in monitors
                if self.monitor_service.overlay_redis_state(m).last_status == MonitorTarget.Status.DOWN
            )
            details.append(("🟢 Uptime", f"{total_mon - down_count}/{total_mon} ổn định"))

        if "finance" in sections:
            spending = self.spending_service.summary(owner, owner=owner)
            spent_str = f"{int(Decimal(spending['total_spent_vnd'])):,} đ".replace(",", ".")
            details.append(("💰 Chi tiêu tháng", spent_str))

        return NotificationPayload(
            title=f"Bản tin ngày {local_today:%d/%m/%Y} ({slot})",
            body=" · ".join(summary_parts) or "Tổng hợp trạng thái công việc và hạ tầng cá nhân.",
            link="/ca-nhan",
            message_key="workspace.notifications.dailyDigest",
            params={"date": local_today.isoformat(), "slot": slot},
            details=tuple(details),
        )

    @staticmethod
    def _parse_dt(raw: Any) -> datetime | None:
        if isinstance(raw, datetime):
            return raw
        if not isinstance(raw, str) or not raw:
            return None
        try:
            parsed = datetime.fromisoformat(raw)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=dj_timezone.get_default_timezone())
        return parsed
