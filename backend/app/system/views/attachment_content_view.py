"""API GET /attachments/{id}/content: mở nội dung file sau khi kiểm quyền.

- File riêng tư trên R2: 302 tới link ký hạn ngắn (`ATTACHMENT_PRIVATE_URL_TTL_SECONDS`).
- File riêng tư trên filesystem (dev): stream nội dung.
- File công khai: 302 tới URL công khai.
- `?stream=1`: luôn stream nội dung qua backend (cùng origin với web) cho chỗ cần đọc bytes bằng
  `fetch`/canvas (trình sửa ảnh), không phụ thuộc CORS của bucket R2.
- Không có quyền hoặc không tồn tại: cùng một 404 (không dò được file riêng tư).
"""

from typing import Any
from uuid import UUID

from django.http import FileResponse, HttpResponseBase, HttpResponseRedirect
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.utils.url import build_absolute_url
from app.core.views.core_api_view import CoreApiView
from app.system.services.attachment_service import AttachmentService
from app.system.services.attachment_storage_service import AttachmentStorageService

NO_STORE = "private, no-store"
# Giá trị `?stream=` bật chế độ luôn stream nội dung.
STREAM_VALUES = frozenset({"1", "true"})


class AttachmentContentView(CoreApiView):
    """Chỉ cần đăng nhập; quyền với từng file do service quyết định (người upload/superuser/read_private)."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.attachment_service = AttachmentService()
        self.storage_service = AttachmentStorageService()

    @extend_schema(
        responses={
            200: OpenApiResponse(
                OpenApiTypes.BINARY, description="Nội dung file (kho riêng tư trên filesystem)."
            ),
            302: OpenApiResponse(description="Chuyển tới link ký hạn ngắn hoặc URL công khai."),
            404: OpenApiResponse(description="Không tồn tại hoặc không có quyền."),
        }
    )
    @rate_limit("system.attachment.content")
    def get(self, request: Request, pk: UUID) -> HttpResponseBase:
        """Mở nội dung file.

        Args:
            request: Request.
            pk: Id file.

        Returns:
            Redirect hoặc nội dung file.
        """
        attachment = self.attachment_service.get_content_for(self.get_actor(request), pk)
        stream = request.query_params.get("stream", "").lower() in STREAM_VALUES
        if not attachment.is_private and not stream:
            return HttpResponseRedirect(build_absolute_url(self.storage_service.public_url(attachment)))

        # Chế độ stream bỏ qua link ký: trình duyệt đọc bytes cùng origin, không cần CORS của bucket.
        signed_url = None if stream else self.storage_service.signed_url(attachment)
        response: HttpResponseBase
        if signed_url:
            response = HttpResponseRedirect(signed_url)
        else:
            response = FileResponse(
                self.storage_service.open(attachment),
                content_type=attachment.content_type,
                as_attachment=self.storage_service.is_download_only(attachment),
                filename=attachment.original_name,
            )
        response["Cache-Control"] = NO_STORE
        response["X-Content-Type-Options"] = "nosniff"
        response["Referrer-Policy"] = "no-referrer"
        return response
