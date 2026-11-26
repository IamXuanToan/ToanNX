"""URL gốc. Mọi API nằm dưới /api/v1 và không có dấu `/` cuối."""

from django.conf import settings
from django.conf.urls.static import static
from django.urls import URLPattern, URLResolver, include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns: list[URLPattern | URLResolver] = [
    path("api/v1/system/", include("app.system.urls")),
    path("api/v1/novel/", include("app.novel.urls")),
    path("api/v1/utilities/", include("app.utilities.urls")),
    path("api/v1/finance/", include("app.finance.urls")),
    path("api/v1/workspace/", include("app.workspace.urls")),
]

if settings.DEBUG:
    urlpatterns += [
        path("api/v1/schema", SpectacularAPIView.as_view(), name="schema"),
        path("api/v1/docs", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
        # Chỉ local: phục vụ file upload từ filesystem. Production dùng URL của object storage.
        *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
    ]

handler400 = "app.core.exceptions.exception_handler.handler400"
handler403 = "app.core.exceptions.exception_handler.handler403"
handler404 = "app.core.exceptions.exception_handler.handler404"
handler500 = "app.core.exceptions.exception_handler.handler500"
