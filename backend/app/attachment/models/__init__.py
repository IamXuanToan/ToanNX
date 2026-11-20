"""Model của Attachment. Django nạp model qua `app.attachment.models`."""

from app.attachment.models.attachment import Attachment
from app.attachment.models.attachment_folder import AttachmentFolder

__all__ = ["Attachment", "AttachmentFolder"]
