"""URL module QR Codes (/api/v1/qr_codes/...)."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.qr_codes.views.qr_bank_view import QrBankView
from app.modules.qr_codes.views.qr_code_view_set import QrCodeViewSet
from app.modules.qr_codes.views.qr_preview_view import QrPreviewView

app_name = "qr_codes"

router = SimpleRouter(trailing_slash=False)
router.register("codes", QrCodeViewSet, basename="codes")

urlpatterns = [
    path("preview", QrPreviewView.as_view(), name="preview"),
    path("banks", QrBankView.as_view(), name="banks"),
    *router.urls,
]
