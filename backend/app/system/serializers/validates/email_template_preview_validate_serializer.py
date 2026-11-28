"""Validate xem trước EmailTemplate với dữ liệu mẫu."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class EmailTemplatePreviewValidateSerializer(CoreValidateSerializer):
    """Cặp khóa-giá trị để trộn thử vào tiêu đề và nội dung email theo ngôn ngữ."""

    locale = serializers.CharField(max_length=10, required=False, default="vi")
    sample_data = serializers.DictField(
        child=serializers.CharField(allow_blank=True, max_length=2000),
        required=False,
        default=dict,
    )
