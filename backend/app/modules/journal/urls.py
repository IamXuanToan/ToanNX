"""URL module Journal (/api/v1/journal/...)."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.journal.views.journal_entry_view_set import JournalEntryViewSet
from app.modules.journal.views.journal_resource_view import JournalResourceView

app_name = "journal"

router = SimpleRouter(trailing_slash=False)
router.register("entries", JournalEntryViewSet, basename="entries")

urlpatterns = [path("resources", JournalResourceView.as_view(), name="resources"), *router.urls]
