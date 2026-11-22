"""NotificationMessageFormatter: khuôn tin Telegram/email thống nhất (icon, dòng chi tiết, giờ, link)."""

from datetime import UTC, datetime

from app.system.models.notification import Notification
from app.system.services.notification_message_formatter import NotificationMessageFormatter

LINK = "https://toannx.com/admin/sessions"


def _notification(**fields: object) -> Notification:
    base: dict[str, object] = {
        "event_code": "system.auth.login",
        "level": "INFO",
        "title": "Có lượt đăng nhập mới",
        "body": "Chrome trên Windows · IP 1.2.3.4",
        "data": {
            "details": [["💻 Thiết bị", "Chrome trên Windows"], ["🌐 IP", "1.2.3.4"], ["🏦 Ngân hàng", ""]]
        },
        "created_at": datetime(2026, 11, 22, 11, 59, tzinfo=UTC),
    }
    base.update(fields)
    return Notification(**base)


def test_telegram_uses_event_icon_details_time_and_link() -> None:
    text = NotificationMessageFormatter().telegram_html(_notification(), LINK)
    assert text.splitlines()[0] == "🔐 <b>Có lượt đăng nhập mới</b>"
    assert "💻 Thiết bị: <b>Chrome trên Windows</b>" in text
    assert "🌐 IP: <b>1.2.3.4</b>" in text
    assert "Ngân hàng" not in text  # dòng trống bị bỏ
    assert "🕒 Thời gian: <b>18:59 · 22/11/2026</b>" in text  # giờ Việt Nam
    assert f'👉 <a href="{LINK}">Xem chi tiết</a>' in text
    assert "IP 1.2.3.4" not in text  # có chi tiết thì không lặp body


def test_telegram_falls_back_to_body_and_level_icon_and_escapes() -> None:
    notification = _notification(
        event_code="unknown.event", level="ERROR", title="Lỗi <x>", body="a & b", data={}
    )
    text = NotificationMessageFormatter().telegram_html(notification, "")
    assert text.startswith("🚨 <b>Lỗi &lt;x&gt;</b>")
    assert "a &amp; b" in text
    assert "Xem chi tiết" not in text


def test_email_plain_text_same_order() -> None:
    text = NotificationMessageFormatter().plain_text(_notification(), LINK)
    assert text.splitlines()[:3] == [
        "💻 Thiết bị: Chrome trên Windows",
        "🌐 IP: 1.2.3.4",
        "🕒 Thời gian: 18:59 · 22/11/2026",
    ]
    assert text.endswith(f"Xem chi tiết: {LINK}")
