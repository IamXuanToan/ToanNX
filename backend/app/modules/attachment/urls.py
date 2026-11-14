"""URL module Attachment (/api/v1/attachments...)."""

from rest_framework.routers import SimpleRouter

from app.modules.attachment.views.attachment_view_set import AttachmentViewSet

app_name = "attachment"

router = SimpleRouter(trailing_slash=False)
router.register("attachments", AttachmentViewSet, basename="attachments")

urlpatterns = router.urls
