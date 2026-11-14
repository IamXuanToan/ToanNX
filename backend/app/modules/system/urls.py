"""URL module System (/api/v1/system/...)."""

from django.urls import path

from app.modules.system.views.module_view import ModuleObjectView, ModuleView

app_name = "system"

urlpatterns = [
    path("modules", ModuleView.as_view(), name="modules"),
    path("modules/<slug:code>", ModuleObjectView.as_view(), name="modules-object"),
]
