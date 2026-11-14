"""Decorator kiểm tra dữ liệu đầu vào cho method của view.

```python
@require_permission(AccountPermission.USER_CREATE)
@validate_request(UserCreateValidateSerializer)
def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse: ...
```

- GET/DELETE: validate `request.query_params`; method khác: validate `request.data`.
- Dữ liệu hợp lệ truyền vào view qua keyword `validated_data`.
- Lỗi validate ném `rest_framework.exceptions.ValidationError` → exception handler trả 400 chuẩn.
- Tự khai báo OpenAPI: query parameters (GET/DELETE/HEAD) hoặc request body (method khác),
  nên view chỉ cần `@extend_schema(responses=...)`.
"""

from collections.abc import Callable
from functools import wraps
from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

_QUERY_METHODS = frozenset({"GET", "DELETE", "HEAD"})
_QUERY_METHOD_NAMES = frozenset(method.lower() for method in _QUERY_METHODS)

ViewMethod = Callable[..., Response]


def validate_request(serializer_class: type[CoreValidateSerializer]) -> Callable[[ViewMethod], ViewMethod]:
    """Tạo decorator validate input bằng serializer.

    Args:
        serializer_class: Validate serializer kế thừa CoreValidateSerializer.

    Returns:
        Decorator cho method của view.
    """

    def decorator(view_method: ViewMethod) -> ViewMethod:
        @wraps(view_method)
        def wrapper(self: Any, request: Request, *args: Any, **kwargs: Any) -> Response:
            source = request.query_params if request.method in _QUERY_METHODS else request.data
            validated_data = serializer_class.validate_data(source)
            return view_method(self, request, *args, validated_data=validated_data, **kwargs)

        wrapper.validate_serializer = serializer_class  # type: ignore[attr-defined]  # metadata cho tooling
        if view_method.__name__ in _QUERY_METHOD_NAMES:
            return extend_schema(parameters=[serializer_class])(wrapper)
        return extend_schema(request=serializer_class)(wrapper)

    return decorator
