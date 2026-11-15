"""URL xác thực (/api/v1/auth/...). Không có endpoint đăng ký."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.authentication.views.admin_auth_session_bulk_delete_view import (
    AdminAuthSessionBulkDeleteView,
)
from app.modules.authentication.views.admin_auth_session_bulk_revoke_view import (
    AdminAuthSessionBulkRevokeView,
)
from app.modules.authentication.views.admin_auth_session_users_view import AdminAuthSessionUsersView
from app.modules.authentication.views.admin_auth_session_view_set import AdminAuthSessionViewSet
from app.modules.authentication.views.csrf_view import CsrfView
from app.modules.authentication.views.login_view import LoginView
from app.modules.authentication.views.logout_all_view import LogoutAllView
from app.modules.authentication.views.logout_view import LogoutView
from app.modules.authentication.views.me_view import MeView
from app.modules.authentication.views.refresh_view import RefreshView
from app.modules.authentication.views.session_view import SessionObjectView, SessionView

app_name = "auth"
router = SimpleRouter(trailing_slash=False)
router.register("admin-sessions", AdminAuthSessionViewSet, basename="admin-sessions")

urlpatterns = [
    path("admin-sessions/users", AdminAuthSessionUsersView.as_view(), name="admin-session-users"),
    path(
        "admin-sessions/bulk-delete",
        AdminAuthSessionBulkDeleteView.as_view(),
        name="admin-sessions-bulk-delete",
    ),
    # Khai trước router để `bulk-revoke` không bị hiểu là `{id}`.
    path(
        "admin-sessions/bulk-revoke",
        AdminAuthSessionBulkRevokeView.as_view(),
        name="admin-sessions-bulk-revoke",
    ),
    *router.urls,
    path("csrf", CsrfView.as_view(), name="csrf"),
    path("login", LoginView.as_view(), name="login"),
    path("refresh", RefreshView.as_view(), name="refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("logout-all", LogoutAllView.as_view(), name="logout-all"),
    path("me", MeView.as_view(), name="me"),
    path("sessions", SessionView.as_view(), name="sessions"),
    path("sessions/<uuid:session_id>", SessionObjectView.as_view(), name="sessions-object"),
]
