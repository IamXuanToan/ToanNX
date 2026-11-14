"""URL quản lý và resolve Short Links."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.short_links.views.short_link_resolve_view import ShortLinkResolveView
from app.modules.short_links.views.short_link_view_set import ShortLinkViewSet

app_name = "short_links"
router = SimpleRouter(trailing_slash=False)
router.register("links", ShortLinkViewSet, basename="links")
urlpatterns = [path("resolve/<slug:slug>", ShortLinkResolveView.as_view(), name="resolve"), *router.urls]
