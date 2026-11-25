"""URL module Tiện ích (/api/v1/utilities/...). Không có dấu `/` ở cuối."""

from django.urls import URLPattern, URLResolver, path
from rest_framework.routers import SimpleRouter

from app.utilities.views.donation_public_feed_view import DonationPublicFeedView
from app.utilities.views.donation_public_leaderboard_view import DonationPublicLeaderboardView
from app.utilities.views.donation_transaction_view_set import DonationTransactionViewSet
from app.utilities.views.donation_webhook_view import DonationWebhookView
from app.utilities.views.page_path_view_set import PagePathViewSet
from app.utilities.views.page_public_view import PagePublicView
from app.utilities.views.page_view_set import PageViewSet
from app.utilities.views.qr_bank_view import QrBankView
from app.utilities.views.qr_code_view_set import QrCodeViewSet
from app.utilities.views.qr_preview_view import QrPreviewView
from app.utilities.views.short_link_resolve_view import ShortLinkResolveView
from app.utilities.views.short_link_view_set import ShortLinkViewSet

app_name = "utilities"

router = SimpleRouter(trailing_slash=False)
router.register("short-links", ShortLinkViewSet, basename="short-links")
router.register("qr-codes", QrCodeViewSet, basename="qr-codes")
router.register("page-paths", PagePathViewSet, basename="page-paths")
router.register("pages", PageViewSet, basename="pages")
router.register("donations", DonationTransactionViewSet, basename="donations")

urlpatterns: list[URLPattern | URLResolver] = [
    path("short-links/resolve/<slug:slug>", ShortLinkResolveView.as_view(), name="short-link-resolve"),
    path("qr-codes/preview", QrPreviewView.as_view(), name="qr-code-preview"),
    path("qr-codes/banks", QrBankView.as_view(), name="qr-code-banks"),
    path("pages/public/<str:segment>/<str:slug>", PagePublicView.as_view(), name="page-public"),
    path(
        "pages/<uuid:page_id>/donations/feed",
        DonationPublicFeedView.as_view(),
        name="donation-public-feed",
    ),
    path(
        "pages/<uuid:page_id>/donations/leaderboard",
        DonationPublicLeaderboardView.as_view(),
        name="donation-public-leaderboard",
    ),
    path("donations/webhook/<str:webhook_token>", DonationWebhookView.as_view(), name="donation-webhook"),
    *router.urls,
]
