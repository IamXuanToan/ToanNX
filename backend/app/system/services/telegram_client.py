"""Client Telegram Bot API dùng token bot của từng người (getMe, getWebhookInfo, getUpdates, getChatMember,
sendMessage). Token chỉ đi qua tham số, không log."""

import logging
from typing import Any

import requests

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.system.constants.notification_defaults import TELEGRAM_API_BASE, TELEGRAM_TIMEOUT_SECONDS
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.types.telegram_send_result import TelegramSendResult

logger = logging.getLogger(__name__)
HTTP_UNAUTHORIZED = 401
HTTP_NOT_FOUND = 404


class TelegramClient:
    """Không dùng webhook Telegram; đọc cập nhật bằng getUpdates khi người dùng bấm Kiểm tra."""

    def __init__(self, session: requests.Session | None = None) -> None:
        """Khởi tạo client."""
        self.session = session or requests.Session()

    def get_me(self, token: str) -> dict[str, Any]:
        """Thông tin bot; token sai → `TELEGRAM_BOT_TOKEN_INVALID`."""
        return self._call(token, "getMe", {})

    def get_webhook_info(self, token: str) -> dict[str, Any]:
        """Kiểm tra trạng thái webhook hiện tại của bot."""
        result = self._call(token, "getWebhookInfo", {})
        return result if isinstance(result, dict) else {}

    def set_webhook(self, token: str, url: str, *, secret_token: str = "") -> Any:
        """Đăng ký webhook nhận sự kiện Telegram cho bot chung."""
        payload: dict[str, Any] = {
            "url": url,
            "allowed_updates": ["message", "my_chat_member"],
        }
        if secret_token:
            payload["secret_token"] = secret_token
        return self._call(token, "setWebhook", payload)

    def get_updates(self, token: str, *, offset: int | None = None, timeout: int = 0) -> list[dict[str, Any]]:
        """Cập nhật gần đây của bot (dùng cho nút Kiểm tra hoặc polling local)."""
        payload: dict[str, Any] = {"allowed_updates": ["message", "my_chat_member"]}
        if offset is not None:
            payload["offset"] = int(offset)
        if timeout > 0:
            payload["timeout"] = min(int(timeout), TELEGRAM_TIMEOUT_SECONDS)
        result = self._call(token, "getUpdates", payload)
        return result if isinstance(result, list) else []

    def get_chat_member(self, token: str, chat_id: str, user_id: int) -> dict[str, Any]:
        """Vai trò của bot trong chat."""
        return self._call(token, "getChatMember", {"chat_id": chat_id, "user_id": user_id})

    def send_message(
        self,
        token: str,
        chat_id: str,
        html: str,
        *,
        reply_to_message_id: int | None = None,
    ) -> TelegramSendResult:
        """Gửi tin HTML; đổi lỗi Telegram thành mã ổn định (403 bị xóa, 429 retry_after, nâng supergroup)."""
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": html,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        if reply_to_message_id is not None:
            payload["reply_to_message_id"] = int(reply_to_message_id)
        try:
            response = self.session.post(
                self._url(token, "sendMessage"),
                json=payload,
                timeout=TELEGRAM_TIMEOUT_SECONDS,
            )
            body = response.json()
        except (requests.RequestException, ValueError):
            return TelegramSendResult(ok=False, error_code=NotificationErrorCode.TELEGRAM_UNAVAILABLE)
        if body.get("ok"):
            return TelegramSendResult(ok=True, message_id=str(body.get("result", {}).get("message_id", "")))
        parameters = body.get("parameters") or {}
        code = int(body.get("error_code") or response.status_code)
        if code in (HTTP_UNAUTHORIZED, HTTP_NOT_FOUND):
            return TelegramSendResult(ok=False, error_code=NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID)
        return TelegramSendResult(
            ok=False,
            error_code=f"TELEGRAM_{code}",
            retry_after=parameters.get("retry_after"),
            migrate_to_chat_id=str(parameters["migrate_to_chat_id"])
            if parameters.get("migrate_to_chat_id")
            else None,
        )

    def _call(self, token: str, method: str, payload: dict[str, Any]) -> Any:
        try:
            response = self.session.post(
                self._url(token, method), json=payload, timeout=TELEGRAM_TIMEOUT_SECONDS
            )
            body = response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Telegram %s lỗi kết nối: %s", method, type(exc).__name__)
            raise BusinessRuleError(
                "Không kết nối được Telegram.", code=NotificationErrorCode.TELEGRAM_UNAVAILABLE
            ) from exc
        if body.get("ok"):
            return body.get("result")
        if response.status_code in (HTTP_UNAUTHORIZED, HTTP_NOT_FOUND):
            raise BusinessRuleError(
                "Token bot không hợp lệ.", code=NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID
            )
        raise BusinessRuleError("Telegram từ chối yêu cầu.", code=NotificationErrorCode.TELEGRAM_UNAVAILABLE)

    @staticmethod
    def _url(token: str, method: str) -> str:
        return f"{TELEGRAM_API_BASE}/bot{token}/{method}"
