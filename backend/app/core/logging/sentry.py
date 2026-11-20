"""Báo lỗi lên Sentry (chỉ bật khi có `SENTRY_DSN`).

- Lỗi 500 (exception chưa xử lý) và log mức ERROR (gồm lỗi trình duyệt gửi về
  `/system/health/client-errors`) thành event; mỗi event gắn tag `request_id` để đối chiếu log và response.
- Không gửi dữ liệu cá nhân (`send_default_pii=False`): không cookie, header, body.
"""

from typing import Any

from app.core.context.user_context import get_request_id


def _attach_request_id(event: dict[str, Any], hint: dict[str, Any]) -> dict[str, Any]:
    """Gắn request id của request hiện tại vào event."""
    request_id = get_request_id()
    if request_id:
        event.setdefault("tags", {})["request_id"] = request_id
    return event


def init_sentry(*, dsn: str, environment: str, release: str, traces_sample_rate: float) -> None:
    """Khởi tạo Sentry; `dsn` rỗng thì không làm gì.

    Args:
        dsn: DSN của project Sentry.
        environment: Môi trường (`production`, `preview`...).
        release: Phiên bản (commit) đang chạy.
        traces_sample_rate: Tỉ lệ lấy mẫu trace hiệu năng (0 = tắt).
    """
    if not dsn:
        return
    import sentry_sdk  # noqa: PLC0415 - chỉ nạp khi bật
    from sentry_sdk.integrations.django import DjangoIntegration  # noqa: PLC0415

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release or None,
        traces_sample_rate=traces_sample_rate,
        send_default_pii=False,
        integrations=[DjangoIntegration()],
        before_send=_attach_request_id,  # type: ignore[arg-type]
    )
