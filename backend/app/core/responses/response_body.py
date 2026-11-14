"""Hàm dựng body response chuẩn (dùng chung cho DRF Response và JsonResponse)."""

from typing import Any

from django.utils import timezone

from app.core.context.user_context import get_request_id


def build_meta(**extra: Any) -> dict[str, Any]:
    """Tạo khối meta chuẩn.

    Args:
        **extra: Trường meta bổ sung (ví dụ `pagination`).

    Returns:
        Dict meta gồm request_id, timestamp.
    """
    return {"request_id": get_request_id(), "timestamp": timezone.now().isoformat(), **extra}


def build_error_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    """Tạo body lỗi chuẩn.

    Args:
        code: Mã lỗi ổn định.
        message: Thông báo.
        details: Chi tiết an toàn.

    Returns:
        Body lỗi.
    """
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "request_id": get_request_id(),
        },
    }
