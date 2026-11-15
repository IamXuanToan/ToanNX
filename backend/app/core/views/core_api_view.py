"""View gốc của mọi API dạng APIView.

Kế thừa theo nhu cầu:

| Lớp | Xác thực | Quyền |
| --- | --- | --- |
| `CoreApiView` | mặc định (settings: JWT cookie/Bearer) | mặc định (settings: đăng nhập + active) |
| `PublicApiView` | không | AllowAny |
| `CsrfPublicApiView` | không | AllowAny + CSRF (đổi trạng thái bằng cookie) |
| `AuthenticatedApiView` (module IAM) | mặc định | đăng nhập |
| `MemberApiView` (module IAM) | mặc định | đăng nhập + `@require_permission` |
| `AdminApiView` (module IAM) | mặc định | đăng nhập + `is_staff` + `@require_permission` |

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
    from app.modules.account.models.user import User


class CoreApiView(APIView):
    """APIView gốc: cấu hình xác thực/quyền mặc định trong settings."""

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
