"""Model của Attachment. Django nạp model qua `app.modules.attachment.models`."""

from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.models.attachment_folder import AttachmentFolder

__all__ = ["Attachment", "AttachmentFolder"]
