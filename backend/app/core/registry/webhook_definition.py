"""Định nghĩa một webhook (endpoint nhận gọi từ bên thứ ba) do module khai báo."""

from dataclasses import dataclass


@dataclass(frozen=True)
class WebhookDefinition:
    """Webhook hiển thị ở Hệ thống → Webhook (URL dựng theo domain backend đang chạy, không hardcode).

    Attributes:
        code: Mã `<module>.<tên>`, ví dụ `finance.sepay`.
        name: Tên ngắn.
        provider: Bên gọi webhook (SePay, Stripe...).
        path: Đường dẫn sau `/api/v1`, bắt đầu bằng `/<module>/` (ví dụ `/finance/sepay/webhook`).
        description: Webhook nhận gì, làm gì với dữ liệu.
        auth: Cách xác thực request (để người cấu hình bên thứ ba chọn đúng).
        setup: Các bước cấu hình phía bên thứ ba.
        method: HTTP method.
    """

    code: str
    name: str
    provider: str
    path: str
    description: str
    auth: str
    setup: tuple[str, ...] = ()
    method: str = "POST"

    @property
    def module(self) -> str:
        """Mã module (phần đầu của mã)."""
        return self.code.split(".", 1)[0]
