"""`uv run python manage.py poll_telegram_assistant`: lắng nghe Telegram 2 chiều ở local."""

from typing import Any

from django.core.management.base import BaseCommand

from app.workspace.services.telegram_polling_service import TelegramPollingService


class Command(BaseCommand):
    """Chạy long-polling cục bộ thay cho webhook khi phát triển trên máy cá nhân."""

    help = "Lắng nghe Telegram getUpdates cục bộ và đẩy qua TelegramWebhookService."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo service polling."""
        super().__init__(*args, **kwargs)
        self.polling_service = TelegramPollingService()

    def add_arguments(self, parser: Any) -> None:
        """Tùy chọn `--once` và `--timeout` phục vụ test/dev."""
        parser.add_argument("--once", action="store_true", help="Chỉ kéo 1 lượt rồi thoát.")
        parser.add_argument("--timeout", type=int, default=20, help="Long polling timeout (giây).")

    def handle(self, *args: Any, **options: Any) -> None:
        """Bắt đầu vòng lặp polling (Ctrl+C để dừng)."""
        once = bool(options.get("once"))
        timeout = int(options.get("timeout") or 20)
        try:
            processed = self.polling_service.run_loop(once=once, timeout=timeout)
            self.stdout.write(f"Đã xử lý {processed} bản tin Telegram.")
        except KeyboardInterrupt:
            self.stdout.write("Đã dừng poll_telegram_assistant.")
