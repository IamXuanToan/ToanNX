"""URL health check (/api/v1/health)."""

from django.urls import path

from app.modules.health.views.cleanup_view import CleanupView
from app.modules.health.views.health_view import HealthView
from app.modules.health.views.readiness_view import ReadinessView

app_name = "health"

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
    path("/ready", ReadinessView.as_view(), name="readiness"),
    path("/cleanup", CleanupView.as_view(), name="cleanup"),
]
