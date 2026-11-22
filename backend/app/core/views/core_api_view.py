"""View gốc của mọi API không phải CRUD (CRUD dùng `CoreModelViewSet`).

Xác thực và quyền **mặc định lấy từ settings**: JWT cookie/Bearer + đăng nhập + quyền IAM khai bằng
`@require_permission` trên method (không khai → 403). Không có lớp con theo kiểu quyền; view nào khác
thì ghi đè ngay trong view đó theo đúng một trong năm trường hợp:

| Trường hợp | Ghi đè trong view |
| --- | --- |
| Đăng nhập + quyền IAM (mặc định) | không; gắn `@require_permission(...)` trên method |
| Chỉ cần đăng nhập | `permission_classes = [IsActiveAuthenticated]` |
| Công khai, chỉ đọc | `authentication_classes = []`, `permission_classes = [AllowAny]` |
| Công khai, đổi trạng thái bằng cookie | như trên, `permission_classes = [AllowAny, CsrfProtected]` |
| Công khai, cần biết ai đang xem | `[AllowAny]`, ghi đè `perform_authentication` (token hỏng = khách) |

Rate limit: `@rate_limit("<khóa RATE_LIMITS>")` trên method (mặc định method ghi dùng `default.write`).

Service khởi tạo trong `__init__` của view con:

```python
def __init__(self, **kwargs: Any) -> None:
    super().__init__(**kwargs)
    self.user_service = UserService()
```
"""

from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from rest_framework.request import Request
from rest_framework.views import APIView

from app.core.exceptions.authentication_error import AuthenticationError

if TYPE_CHECKING:
    from app.system.models.user import User


class CoreApiView(APIView):
    """APIView gốc: xác thực/quyền/rate limit mặc định trong settings."""

    @staticmethod
    def get_actor(request: Request) -> "User":
        """Người dùng đã xác thực của request (gọi sau khi permission đã kiểm tra).

        Args:
            request: DRF request.

        Returns:
            Người dùng (AUTH_USER_MODEL).

        Raises:
            AuthenticationError: Request chưa xác thực.
        """
        user = request.user
        if not isinstance(user, get_user_model()):
            raise AuthenticationError()
        return user
