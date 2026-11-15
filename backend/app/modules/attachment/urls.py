"""URL module Attachment (/api/v1/attachments...)."""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.attachment.views.attachment_bulk_delete_view import AttachmentBulkDeleteView
from app.modules.attachment.views.attachment_bulk_update_view import AttachmentBulkUpdateView
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
    path("attachments/bulk-update", AttachmentBulkUpdateView.as_view(), name="attachments-bulk-update"),
    path("attachments/bulk-delete", AttachmentBulkDeleteView.as_view(), name="attachments-bulk-delete"),
    *router.urls,
]
