"""URL xác thực (/api/v1/auth/...). Không có endpoint đăng ký."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.authentication.views.admin_auth_session_view_set import AdminAuthSessionViewSet
from app.authentication.views.csrf_view import CsrfView
from app.authentication.views.login_view import LoginView
from app.authentication.views.logout_all_view import LogoutAllView
from app.authentication.views.logout_view import LogoutView
from app.authentication.views.me_view import MeView
from app.authentication.views.password_reset_confirm_view import PasswordResetConfirmView
from app.authentication.views.password_reset_request_view import PasswordResetRequestView
from app.authentication.views.password_reset_validate_token_view import (
    PasswordResetValidateTokenView,
)
from app.authentication.views.refresh_view import RefreshView
from app.authentication.views.session_view import SessionObjectView, SessionView

app_name = "auth"
router = SimpleRouter(trailing_slash=False)
router.register("admin-sessions", AdminAuthSessionViewSet, basename="admin-sessions")

urlpatterns = [
    *router.urls,
    path("csrf", CsrfView.as_view(), name="csrf"),
    path("login", LoginView.as_view(), name="login"),
    path("password-reset/request", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path(
        "password-reset/validate-token",
        PasswordResetValidateTokenView.as_view(),
        name="password-reset-validate-token",
    ),
    path("password-reset/confirm", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("refresh", RefreshView.as_view(), name="refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("logout-all", LogoutAllView.as_view(), name="logout-all"),
    path("me", MeView.as_view(), name="me"),
    path("sessions", SessionView.as_view(), name="sessions"),
    path("sessions/<uuid:session_id>", SessionObjectView.as_view(), name="sessions-object"),
]
