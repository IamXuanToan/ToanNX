"""URL health check (/api/v1/health)."""

from django.urls import path

from app.health.views.cleanup_view import CleanupView
from app.health.views.client_error_view import ClientErrorView
from app.health.views.health_view import HealthView
from app.health.views.readiness_view import ReadinessView

app_name = "health"

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
    path("/ready", ReadinessView.as_view(), name="readiness"),
    path("/cleanup", CleanupView.as_view(), name="cleanup"),
    path("/client-errors", ClientErrorView.as_view(), name="client-errors"),
]
