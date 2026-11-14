"""URL quản lý và công khai Custom Pages."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.custom_pages.views.page_block_collection_view import PageBlockCollectionView
from app.modules.custom_pages.views.page_block_object_view import PageBlockObjectView
from app.modules.custom_pages.views.page_block_reorder_view import PageBlockReorderView
from app.modules.custom_pages.views.page_public_view import PagePublicView
from app.modules.custom_pages.views.page_view_set import PageViewSet

app_name = "custom_pages"
router = SimpleRouter(trailing_slash=False)
router.register("pages", PageViewSet, basename="pages")
urlpatterns = [
    path("public/<slug:slug>", PagePublicView.as_view(), name="public"),
    path("pages/<uuid:page_id>/blocks/reorder", PageBlockReorderView.as_view(), name="blocks-reorder"),
    path("pages/<uuid:page_id>/blocks/<uuid:block_id>", PageBlockObjectView.as_view(), name="blocks-object"),
    path("pages/<uuid:page_id>/blocks", PageBlockCollectionView.as_view(), name="blocks"),
    *router.urls,
]
