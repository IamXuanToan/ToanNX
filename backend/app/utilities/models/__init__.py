"""Model của module Tiện ích; import để Django nạp."""

from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath
from app.utilities.models.qr_code import QrCode
from app.utilities.models.short_link import ShortLink

__all__ = ["Page", "PagePath", "QrCode", "ShortLink"]
