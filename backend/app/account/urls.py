"""URL của Account (/api/v1/account/...).

Thao tác hàng loạt là action của ViewSet (`bulk-update`, `bulk-delete`).
"""

from rest_framework.routers import SimpleRouter

from app.account.views.user_view_set import UserViewSet

app_name = "account"

router = SimpleRouter(trailing_slash=False)
router.register("users", UserViewSet, basename="users")

urlpatterns = [
    *router.urls,
]
