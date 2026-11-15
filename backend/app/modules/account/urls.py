"""URL của Account (/api/v1/account/...).

Thao tác hàng loạt khai trước router để `bulk-*` không bị hiểu là `{id}`.
"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.account.views.user_bulk_delete_view import UserBulkDeleteView
from app.modules.account.views.user_bulk_update_view import UserBulkUpdateView
from app.modules.account.views.user_view_set import UserViewSet

app_name = "account"

router = SimpleRouter(trailing_slash=False)
router.register("users", UserViewSet, basename="users")

urlpatterns = [
    path("users/bulk-update", UserBulkUpdateView.as_view(), name="users-bulk-update"),
    path("users/bulk-delete", UserBulkDeleteView.as_view(), name="users-bulk-delete"),
    *router.urls,
]
