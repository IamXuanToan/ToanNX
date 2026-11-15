"""URL gốc. Mọi API nằm dưới /api/v1 và không có dấu `/` cuối."""

from django.conf import settings
from django.conf.urls.static import static
from django.urls import URLPattern, URLResolver, include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns: list[URLPattern | URLResolver] = [
    path("api/v1/auth/", include("app.modules.authentication.urls")),
    path("api/v1/account/", include("app.modules.account.urls")),
    path("api/v1/iam/", include("app.modules.iam.urls")),
    path("api/v1/", include("app.modules.attachment.urls")),
    path("api/v1/health", include("app.modules.health.urls")),
    path("api/v1/short_links/", include("app.modules.short_links.urls")),
    path("api/v1/custom_pages/", include("app.modules.custom_pages.urls")),
]

if settings.DEBUG:
    urlpatterns += [
        path("api/v1/schema", SpectacularAPIView.as_view(), name="schema"),
        path("api/v1/docs", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
        # Chỉ local: phục vụ file upload từ filesystem. Production dùng URL của object storage.
        *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
    ]

handler404 = "app.core.exceptions.exception_handler.handler404"
handler500 = "app.core.exceptions.exception_handler.handler500"
