"""URL của Account (/api/v1/account/...)."""

from rest_framework.routers import SimpleRouter

from app.modules.account.views.user_view_set import UserViewSet

app_name = "account"

router = SimpleRouter(trailing_slash=False)
router.register("users", UserViewSet, basename="users")

urlpatterns = [*router.urls]
