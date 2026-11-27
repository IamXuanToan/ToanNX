"""Quản lý cache Redis & hẹn lịch QStash cho đường W4 (Digest/Reminder/Bảo hành/Gia hạn)."""

from datetime import datetime, time, timedelta
from typing import Any, cast

from django.db import transaction
from django.utils import timezone as dj_timezone

from app.core.cache.cache_service import CacheService
from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.utils.url import build_backend_url
from app.system.services.qstash_client import QstashClient
from app.system.services.user_service import UserService
from app.workspace.constants.workspace_defaults import (
    ALERT_LOOKAHEAD_WINDOW_DAYS,
    ALERT_SENT_TTL_SECONDS,
    ALERTS_NEXT_DUE_TTL_SECONDS,
    CRON_LOCK_TTL_SECONDS,
    DEFAULT_DIGEST_TIME_SLOTS,
    DEFAULT_REMINDER_DAYS_BEFORE,
    DEFAULT_WARRANTY_ALERT_DAYS,
    DIGEST_SENT_TTL_SECONDS,
    DIGEST_WINDOW_SECONDS,
    REDIS_ALERT_SENT_KEY,
    REDIS_ALERTS_NEXT_DUE_KEY,
    REDIS_DIGEST_SENT_KEY,
    REDIS_REMINDER_SENT_KEY,
    REDIS_W4_LOCK_KEY,
    REMINDER_BACKSTOP_WINDOW_SECONDS,
    REMINDER_SENT_TTL_SECONDS,
)
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

DEFAULT_REMINDER_FALLBACK_TIME = time(8, 0)
MAX_NEXT_DUE_WINDOW_DAYS = 7
RECENT_DUE_GRACE_SECONDS = DIGEST_WINDOW_SECONDS


class WorkspaceAlertsCacheService:
    """Giữ trạng thái Redis W4, đảm bảo Neon 0 CU khi rảnh và chống gửi trùng."""

    def __init__(
        self,
        cache_service: CacheService | None = None,
        qstash_client: QstashClient | None = None,
        reminder_repository: ReminderRepository | None = None,
        config_service: AssistantConfigService | None = None,
        user_service: UserService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
        asset_repository: AssetRepository | None = None,
        subscription_repository: SubscriptionRepository | None = None,
    ) -> None:
        """Khởi tạo cache Redis, QStash và các repository tối giản để re-warm."""
        self.cache_service = cache_service or CacheService()
        self.qstash_client = qstash_client or QstashClient()
        self.reminder_repository = reminder_repository or ReminderRepository()
        self.config_service = config_service or AssistantConfigService()
        self.user_service = user_service or UserService()
        self.tz_service = tz_service or WorkspaceTimezoneService()
        self.asset_repository = asset_repository or AssetRepository()
        self.subscription_repository = subscription_repository or SubscriptionRepository()

    def acquire_w4_lock(self) -> bool:
        """Chiếm lock quét Digest/Reminder/Cảnh báo (TTL 30s)."""
        return self.cache_service.set_if_absent(REDIS_W4_LOCK_KEY, "1", CRON_LOCK_TTL_SECONDS)

    def release_w4_lock(self) -> None:
        """Giải phóng lock W4."""
        self.cache_service.delete(REDIS_W4_LOCK_KEY)

    def acquire_digest_slot_lock(self, owner_id: Any, date_str: str, slot: str) -> bool:
        """Chống gửi trùng Digest cho cùng owner + ngày + khung giờ."""
        key = REDIS_DIGEST_SENT_KEY.format(owner_id=owner_id, date_str=date_str, slot=slot)
        return self.cache_service.set_if_absent(key, "1", DIGEST_SENT_TTL_SECONDS)

    def is_digest_slot_sent(self, owner_id: Any, date_str: str, slot: str) -> bool:
        """Kiểm tra khung giờ Digest đã được phát trước đó chưa."""
        if not self.cache_service.enabled:
            return False
        key = REDIS_DIGEST_SENT_KEY.format(owner_id=owner_id, date_str=date_str, slot=slot)
        return self.cache_service.get_json(key) is not None

    def mark_reminder_notified(self, reminder_id: Any, due_date_str: str) -> None:
        """Đánh dấu nhắc việc đã được xử lý trong Redis để không đánh thức W4 lặp lại."""
        if not self.cache_service.enabled:
            return
        key = REDIS_REMINDER_SENT_KEY.format(reminder_id=reminder_id, due_date=due_date_str)
        self.cache_service.set_json(key, "1", REMINDER_SENT_TTL_SECONDS)

    def is_reminder_notified(self, reminder_id: Any, due_date_str: str) -> bool:
        """Kiểm tra nhắc việc đã được xử lý trước đó hay chưa."""
        if not self.cache_service.enabled:
            return False
        key = REDIS_REMINDER_SENT_KEY.format(reminder_id=reminder_id, due_date=due_date_str)
        return self.cache_service.get_json(key) is not None

    def mark_alert_notified(self, alert_key: str) -> None:
        """Đánh dấu cảnh báo bảo hành/dịch vụ đã xử lý hôm nay để tránh lặp W4."""
        if not self.cache_service.enabled:
            return
        key = REDIS_ALERT_SENT_KEY.format(alert_key=alert_key)
        self.cache_service.set_json(key, "1", ALERT_SENT_TTL_SECONDS)

    def is_alert_notified(self, alert_key: str) -> bool:
        """Kiểm tra cảnh báo bảo hành/dịch vụ đã xử lý hôm nay chưa."""
        if not self.cache_service.enabled:
            return False
        key = REDIS_ALERT_SENT_KEY.format(alert_key=alert_key)
        return self.cache_service.get_json(key) is not None

    def reminder_schedule_key(self, reminder: Any) -> str:
        """Khóa lịch hẹn của reminder theo ngày, giờ và phút nhắc trước để sửa giờ vẫn gửi lại."""
        time_part = reminder.due_time.strftime("%H%M") if reminder.due_time else "default"
        return f"{reminder.due_date.isoformat()}:{time_part}:{int(reminder.notify_minutes_before or 0)}"

    @staticmethod
    def _register_on_commit_once(key: str, callback: Any) -> None:
        conn = transaction.get_connection()
        if conn.in_atomic_block and any(
            getattr(entry[1], "_ws_on_commit_key", None) == key for entry in conn.run_on_commit
        ):
            return

        def _wrapped() -> None:
            callback()

        cast(Any, _wrapped)._ws_on_commit_key = key
        transaction.on_commit(_wrapped)

    def read_alerts_next_due(self) -> int | None:
        """Đọc epoch giây tới hạn tiếp theo từ Redis (`None` khi miss hoặc Redis tắt)."""
        data = self.cache_service.get_json(REDIS_ALERTS_NEXT_DUE_KEY)
        if isinstance(data, dict) and isinstance(data.get("epoch"), int):
            return int(data["epoch"])
        if isinstance(data, int):
            return data
        return None

    def write_alerts_next_due(self, epoch: int) -> None:
        """Ghi epoch giây `alerts_next_due` vào Redis (TTL 24h để mỗi ngày kiểm DB lại ít nhất 1 lần)."""
        self.cache_service.set_json(
            REDIS_ALERTS_NEXT_DUE_KEY,
            {"epoch": int(epoch)},
            ALERTS_NEXT_DUE_TTL_SECONDS,
        )

    @staticmethod
    def _pick_earliest(earliest: int | None, candidate_ts: int, window_end_ts: int) -> int | None:
        """Giữ mốc sớm nhất nằm trong cửa sổ 7 ngày."""
        if candidate_ts > window_end_ts:
            return earliest
        if earliest is None or candidate_ts < earliest:
            return candidate_ts
        return earliest

    def _earliest_threshold_alert_ts(
        self,
        *,
        current: datetime,
        now_ts: int,
        target_date: Any,
        thresholds: list[int] | tuple[int, ...],
        tz_name: str,
        dedup_prefix: str,
    ) -> int | None:
        """Tìm thời điểm cảnh báo sớm nhất trong 7 ngày theo danh sách ngưỡng ngày trước hạn."""
        local_today = self.tz_service.local_today(tz_name, now=current)
        window_end_ts = now_ts + MAX_NEXT_DUE_WINDOW_DAYS * 24 * 3600
        earliest: int | None = None
        for raw_days in thresholds:
            days_before = int(raw_days)
            alert_date = target_date - timedelta(days=days_before)
            if alert_date < local_today:
                continue
            alert_key = f"{dedup_prefix}:{days_before}"
            if alert_date == local_today:
                if self.is_alert_notified(alert_key):
                    continue
                candidate_ts = now_ts
            else:
                candidate_utc = self.tz_service.local_to_utc(alert_date, time(0, 0), tz_name)
                candidate_ts = int(candidate_utc.timestamp())
            earliest = self._pick_earliest(earliest, candidate_ts, window_end_ts)
        return earliest

    def compute_next_due_epoch(self, *, now: datetime | None = None) -> int | None:
        """Tính mốc UTC epoch sớm nhất trong 7 ngày tới cần đánh thức W4 (`None` khi hoàn toàn rảnh)."""
        current = now or dj_timezone.now()
        now_ts = int(current.timestamp())
        window_end_ts = now_ts + MAX_NEXT_DUE_WINDOW_DAYS * 24 * 3600
        earliest: int | None = None

        admin_cfg = self.config_service.get_config()
        digest_slots = admin_cfg.get("digest_time_slots") or list(DEFAULT_DIGEST_TIME_SLOTS)
        warranty_thresholds = admin_cfg.get("warranty_alert_days") or list(DEFAULT_WARRANTY_ALERT_DAYS)
        sub_default_thresholds = admin_cfg.get("subscription_default_alert_days") or list(
            DEFAULT_REMINDER_DAYS_BEFORE
        )

        start_date = (
            current - timedelta(seconds=REMINDER_BACKSTOP_WINDOW_SECONDS) - timedelta(days=1)
        ).date()
        end_date = current.date() + timedelta(days=MAX_NEXT_DUE_WINDOW_DAYS + 1)
        pending_reminders = self.reminder_repository.list_all_pending_up_to(end_date, start_date=start_date)
        for reminder in pending_reminders:
            if not self.is_reminder_notified(reminder.pk, self.reminder_schedule_key(reminder)):
                due_time = reminder.due_time or DEFAULT_REMINDER_FALLBACK_TIME
                trigger_utc = self.tz_service.local_to_utc(reminder.due_date, due_time, DEFAULT_TIMEZONE)
                trigger_utc -= timedelta(minutes=int(reminder.notify_minutes_before or 0))
                candidate_ts = int(trigger_utc.timestamp())
                if candidate_ts >= now_ts - REMINDER_BACKSTOP_WINDOW_SECONDS:
                    earliest = self._pick_earliest(earliest, max(now_ts, candidate_ts), window_end_ts)

            rem_days = reminder.reminder_days_before or []
            if rem_days:
                candidate = self._earliest_threshold_alert_ts(
                    current=current,
                    now_ts=now_ts,
                    target_date=reminder.due_date,
                    thresholds=rem_days,
                    tz_name=DEFAULT_TIMEZONE,
                    dedup_prefix=f"rem_day:{reminder.pk}:{reminder.due_date.isoformat()}",
                )
                if candidate is not None:
                    earliest = self._pick_earliest(earliest, candidate, window_end_ts)

        active_users = self.user_service.list_active()
        if active_users:
            local_today = self.tz_service.local_today(DEFAULT_TIMEZONE, now=current)
            for offset in (-1, 0, 1):
                day = local_today + timedelta(days=offset)
                date_str = day.isoformat()
                for raw_slot in digest_slots:
                    parsed = self.tz_service.parse_hhmm(str(raw_slot))
                    if parsed is None:
                        continue
                    candidate_utc = self.tz_service.local_to_utc(day, parsed, DEFAULT_TIMEZONE)
                    candidate_ts = int(candidate_utc.timestamp())
                    if candidate_ts < now_ts - RECENT_DUE_GRACE_SECONDS:
                        continue
                    if candidate_ts <= now_ts and all(
                        self.is_digest_slot_sent(user.pk, date_str, str(raw_slot)) for user in active_users
                    ):
                        continue
                    earliest = self._pick_earliest(earliest, max(now_ts, candidate_ts), window_end_ts)

        lookahead_end = current.date() + timedelta(
            days=MAX_NEXT_DUE_WINDOW_DAYS + ALERT_LOOKAHEAD_WINDOW_DAYS
        )
        assets = self.asset_repository.list_all_warranty_expiring_between(
            current.date() - timedelta(days=1), lookahead_end
        )
        for asset in assets:
            if asset.warranty_end_date is None:
                continue
            candidate = self._earliest_threshold_alert_ts(
                current=current,
                now_ts=now_ts,
                target_date=asset.warranty_end_date,
                thresholds=warranty_thresholds,
                tz_name=DEFAULT_TIMEZONE,
                dedup_prefix=f"war:{asset.pk}:{asset.warranty_end_date.isoformat()}",
            )
            if candidate is not None:
                earliest = self._pick_earliest(earliest, candidate, window_end_ts)

        subs = self.subscription_repository.list_all_active_upcoming(
            lookahead_end, start_date=current.date() - timedelta(days=1)
        )
        for sub in subs:
            thresholds = sub.reminder_days_before or sub_default_thresholds
            candidate = self._earliest_threshold_alert_ts(
                current=current,
                now_ts=now_ts,
                target_date=sub.renew_date,
                thresholds=thresholds,
                tz_name=DEFAULT_TIMEZONE,
                dedup_prefix=f"sub:{sub.pk}:{sub.renew_date.isoformat()}",
            )
            if candidate is not None:
                earliest = self._pick_earliest(earliest, candidate, window_end_ts)

        return earliest

    def refresh_alerts_next_due(self, *, now: datetime | None = None) -> int:
        """Tính lại `alerts_next_due`, nạp Redis TTL 24h; hẹn QStash khi có việc trong 7 ngày."""
        current = now or dj_timezone.now()
        now_ts = int(current.timestamp())
        next_due = self.compute_next_due_epoch(now=current)
        target_epoch = next_due if next_due is not None else now_ts + MAX_NEXT_DUE_WINDOW_DAYS * 24 * 3600
        if self.cache_service.enabled:
            self.write_alerts_next_due(target_epoch)

        if next_due is not None and self.qstash_client.is_configured():
            delay = max(0, next_due - now_ts)
            if delay <= MAX_NEXT_DUE_WINDOW_DAYS * 24 * 3600:
                bucket = next_due // 60
                self.qstash_client.publish(
                    build_backend_url("/api/v1/workspace/cron/dispatch-due"),
                    delay_seconds=delay,
                    deduplication_id=f"ws-alerts-{bucket}",
                )
        return target_epoch

    def schedule_alerts_next_due_on_commit(self) -> None:
        """Cập nhật `alerts_next_due` + QStash sau khi transaction commit (gộp nếu gọi lặp)."""
        self._register_on_commit_once("ws:refresh_alerts_next_due", self.refresh_alerts_next_due)
