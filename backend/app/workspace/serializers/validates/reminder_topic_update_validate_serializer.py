"""Validate cập nhật Chủ đề nhắc việc."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ReminderTopicUpdateValidateSerializer(CoreValidateSerializer):
    """Đầu vào PATCH chủ đề nhắc việc."""

    name = serializers.CharField(max_length=80, required=False, help_text="Tên chủ đề mới.")
    color = serializers.RegexField(r"^#[0-9a-fA-F]{6}$", required=False, help_text="Mã màu #RRGGBB.")
    sort_order = serializers.IntegerField(
        min_value=0, max_value=9999, required=False, help_text="Thứ tự sắp xếp."
    )
