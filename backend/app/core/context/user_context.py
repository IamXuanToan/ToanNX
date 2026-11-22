"""Ngữ cảnh request dùng `contextvars` (request_id, request, người dùng hiện tại).

Middleware mở/đóng phạm vi ngữ cảnh cho từng request nên không rò giữa các request.
Ngoài request (shell, management command) các hàm `get_*` trả về None.
Business logic quan trọng nên nhận `actor` tường minh; context chỉ là giá trị
dự phòng cho audit và logging.
"""

from collections.abc import Generator
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)
_current_user: ContextVar[Any | None] = ContextVar("current_user", default=None)
_current_request: ContextVar[Any | None] = ContextVar("current_request", default=None)


@contextmanager
def request_context(request_id: str, request: Any | None = None) -> Generator[None]:
    """Mở phạm vi ngữ cảnh request; tự reset khi kết thúc kể cả khi có lỗi.

    Args:
        request_id: Định danh request.
        request: HttpRequest hiện tại (dùng dựng URL tuyệt đối).

    Yields:
        None.
    """
    request_token = _request_id.set(request_id)
    user_token = _current_user.set(None)
    http_request_token = _current_request.set(request)
    try:
        yield
    finally:
        _current_request.reset(http_request_token)
        _current_user.reset(user_token)
        _request_id.reset(request_token)


def set_current_user(user: Any | None) -> None:
    """Gán người dùng đã xác thực vào ngữ cảnh hiện tại.

    Args:
        user: Người dùng đã xác thực hoặc None.
    """
    _current_user.set(user)


def get_current_user() -> Any | None:
    """Lấy người dùng đã xác thực của request hiện tại.

    Returns:
        Người dùng hoặc None.
    """
    user = _current_user.get()
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    return user


def get_user_id() -> Any | None:
    """Lấy id người dùng hiện tại.

    Returns:
        Id hoặc None.
    """
    user = get_current_user()
    return user.pk if user is not None else None


def get_request_id() -> str | None:
    """Lấy request_id hiện tại.

    Returns:
        request_id hoặc None khi chạy ngoài request.
    """
    return _request_id.get()


def get_current_request() -> Any | None:
    """Lấy HttpRequest hiện tại.

    Returns:
        HttpRequest hoặc None khi chạy ngoài request.
    """
    return _current_request.get()
