"""Định nghĩa một URL callback (bên thứ ba chuyển người dùng về, ví dụ OAuth) do module khai báo."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CallbackDefinition:
    """Callback hiển thị ở Hệ thống → Callback; URL dựng theo origin FE đang dùng (không hardcode domain).

    Attributes:
        code: Mã `<module>.<tên>`, ví dụ `system.google_oauth`.
        name: Tên ngắn.
        provider: Bên chuyển hướng về (Google, GitHub...).
        path: Đường dẫn trên FE, bắt đầu bằng `/` (ví dụ `/auth/callback/google`).
        description: Callback dùng để làm gì.
        setup: Các bước khai URL phía bên thứ ba.
        setting: Tên setting cho biết đã cấu hình (ví dụ `GOOGLE_OAUTH_CLIENT_ID`); trống = không kiểm.
    """

    code: str
    name: str
    provider: str
    path: str
    description: str
    setup: tuple[str, ...] = ()
    setting: str = ""

    @property
    def module(self) -> str:
        """Mã module (phần đầu của mã)."""
        return self.code.split(".", 1)[0]
