"""URL module Attachment (/api/v1/attachments...)."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.attachment.views.attachment_folder_delete_view import AttachmentFolderDeleteView
from app.modules.attachment.views.attachment_folder_view_set import AttachmentFolderViewSet
from app.modules.attachment.views.attachment_view_set import AttachmentViewSet

app_name = "attachment"

router = SimpleRouter(trailing_slash=False)
router.register("attachments/folders", AttachmentFolderViewSet, basename="attachment-folders")
router.register("attachments", AttachmentViewSet, basename="attachments")

urlpatterns = [
    path(
        "attachments/folders/<uuid:pk>/delete",
        AttachmentFolderDeleteView.as_view(),
        name="attachment-folder-delete",
    ),
    *router.urls,
]
