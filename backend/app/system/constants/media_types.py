"""Danh mục loại và định dạng media đã được backend hỗ trợ."""

MEDIA_KINDS = (("IMAGE", "Ảnh"), ("VIDEO", "Video"), ("DOCUMENT", "Tài liệu"))
CONTENT_TYPES_BY_KIND = {
    "IMAGE": ("image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"),
    "VIDEO": ("video/mp4", "video/webm", "video/quicktime"),
    "DOCUMENT": ("application/pdf",),
}
ALLOWED_CONTENT_TYPES = tuple(
    content_type for values in CONTENT_TYPES_BY_KIND.values() for content_type in values
)
UNFILED_FOLDER = "UNFILED"
