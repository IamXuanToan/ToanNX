"""URL module Custom Pages (/api/v1/custom_pages/...)."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.custom_pages.views.page_path_view_set import PagePathViewSet
from app.modules.custom_pages.views.page_public_view import PagePublicView
from app.modules.custom_pages.views.page_view_set import PageViewSet

app_name = "custom_pages"

router = SimpleRouter(trailing_slash=False)
router.register("paths", PagePathViewSet, basename="paths")
router.register("pages", PageViewSet, basename="pages")

urlpatterns = [
    path("public/<str:segment>/<str:slug>", PagePublicView.as_view(), name="public"),
    *router.urls,
]
