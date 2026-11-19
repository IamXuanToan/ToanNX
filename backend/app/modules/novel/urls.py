"""URL routing cho phân hệ Novel. Không có dấu `/` ở cuối."""

from django.urls import URLPattern, URLResolver, path
from rest_framework.routers import SimpleRouter

from app.modules.novel.views.author_view_set import AuthorViewSet
from app.modules.novel.views.chapter_client_view import ChapterClientView
from app.modules.novel.views.chapter_view_set import ChapterViewSet
from app.modules.novel.views.favorite_view import FavoriteView
from app.modules.novel.views.genre_view_set import GenreViewSet
from app.modules.novel.views.novel_client_view import NovelClientView
from app.modules.novel.views.novel_import_view import NovelImportView
from app.modules.novel.views.novel_view_set import NovelViewSet
from app.modules.novel.views.reading_history_object_view import ReadingHistoryObjectView
from app.modules.novel.views.reading_history_view import ReadingHistoryView
from app.modules.novel.views.tag_view_set import TagViewSet

router = SimpleRouter(trailing_slash=False)
router.register("novels", NovelViewSet, basename="novel")
router.register("chapters", ChapterViewSet, basename="chapter")
router.register("authors", AuthorViewSet, basename="author")
router.register("genres", GenreViewSet, basename="genre")
router.register("tags", TagViewSet, basename="tag")

urlpatterns: list[URLPattern | URLResolver] = [
    path("novels/import-template", NovelImportView.as_view(), name="novel-import-template"),
    path("novels/import", NovelImportView.as_view(), name="novel-import"),
    path("client/novels/<slug:slug>", NovelClientView.as_view(), name="novel-client-detail"),
    path(
        "client/chapters/<slug:novel_slug>/<int:chapter_number>",
        ChapterClientView.as_view(),
        name="chapter-client-detail",
    ),
    path("reading-history", ReadingHistoryView.as_view(), name="reading-history"),
    path("reading-history/<uuid:pk>", ReadingHistoryObjectView.as_view(), name="reading-history-detail"),
    path("favorites", FavoriteView.as_view(), name="favorite-list"),
    path("favorites/toggle", FavoriteView.as_view(), name="favorite-toggle"),
    *router.urls,
]
