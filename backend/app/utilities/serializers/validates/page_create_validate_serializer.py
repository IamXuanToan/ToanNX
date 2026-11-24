"""Validate POST /utilities/pages."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.utilities.constants.page_templates import TEMPLATE_CHOICES
from app.utilities.models.page import Page


class PageCreateValidateSerializer(CoreValidateSerializer):
    """Tạo trang; owner lấy từ phiên. Không gửi `content` thì dùng mẫu `template` (mặc định trống)."""

    path_id = serializers.UUIDField(help_text="Đường dẫn giữa (đang bật).")
    title = serializers.CharField(max_length=150, help_text="Tiêu đề trang.")
    slug = serializers.CharField(required=False, max_length=64, help_text="Slug tùy chọn, bỏ qua để tự sinh.")
    description = serializers.CharField(required=False, allow_blank=True, max_length=1000, help_text="Mô tả.")
    status = serializers.ChoiceField(
        required=False, choices=Page.Status.choices, help_text="DRAFT, PUBLISHED hoặc UNPUBLISHED."
    )
    seo_title = serializers.CharField(
        required=False, allow_blank=True, max_length=160, help_text="Tiêu đề SEO."
    )
    seo_description = serializers.CharField(
        required=False, allow_blank=True, max_length=300, help_text="Mô tả SEO."
    )
    theme = serializers.JSONField(required=False, help_text="Theme: mode, màu chính/nền/chữ, kiểu nút.")
    page_type = serializers.ChoiceField(
        required=False, choices=Page.PageType.choices, help_text="Loại trang."
    )
    template_key = serializers.CharField(required=False, max_length=64, help_text="Mã template hệ thống.")
    template_version = serializers.IntegerField(required=False, min_value=1, help_text="Phiên bản template.")
    content_config = serializers.JSONField(required=False, help_text="Dữ liệu nội dung theo template.")
    style_config = serializers.JSONField(required=False, help_text="Cấu hình giao diện và phong cách.")
    responsive_config = serializers.JSONField(required=False, help_text="Cấu hình responsive theo thiết bị.")
    avatar_id = serializers.UUIDField(required=False, allow_null=True, help_text="Ảnh đại diện (Thư viện).")
    cover_id = serializers.UUIDField(required=False, allow_null=True, help_text="Ảnh bìa (Thư viện).")
    content = serializers.JSONField(required=False, help_text="Tài liệu Tiptap JSON.")
    template = serializers.ChoiceField(
        required=False, choices=TEMPLATE_CHOICES, help_text="Mẫu bắt đầu: blank, link_in_bio, about, donate."
    )
