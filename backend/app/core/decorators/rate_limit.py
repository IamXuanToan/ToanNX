"""Khai rate limit cho method của APIView (ViewSet dùng `action_rate_limits`).

```python
@require_permission(QrCodesPermission.CREATE)
@rate_limit(UtilitiesRateLimitKey.QR_CODE_PREVIEW)   # khóa StrEnum trong settings.RATE_LIMITS
def post(self, request: Request) -> CoreResponse: ...
```

Throttle cấu hình ở `DEFAULT_THROTTLE_CLASSES` đọc khóa này; method ghi không khai thì
dùng `CoreRateLimitKey.DEFAULT_WRITE`."""

from collections.abc import Callable
from enum import StrEnum
from typing import Any

RATE_LIMIT_ATTR = "rate_limit_key"


def rate_limit(key: StrEnum) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Gắn khóa rate limit (`StrEnum`) lên method.

    Args:
        key: Khóa trong `settings.RATE_LIMITS`.

    Returns:
        Decorator giữ nguyên method.
    """

    def decorator(view_method: Callable[..., Any]) -> Callable[..., Any]:
        setattr(view_method, RATE_LIMIT_ATTR, key)
        return view_method

    return decorator
