"""Validate tạo mới EmailTemplate."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.models.email_template import EmailTemplate


class EmailTemplateCreateValidateSerializer(CoreValidateSerializer):
    """Input tạo mới mẫu email đa ngôn ngữ Tiptap."""

    code = serializers.SlugField(max_length=80)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    description = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")
    locale = serializers.CharField(max_length=10, required=False, default="vi")
    scope = serializers.ChoiceField(
        choices=EmailTemplate.Scope.choices,
        required=False,
        default=EmailTemplate.Scope.PERSONAL,
    )
    category = serializers.ChoiceField(
        choices=EmailTemplate.Category.choices,
        required=False,
        default=EmailTemplate.Category.CUSTOM,
    )
    status = serializers.ChoiceField(
        choices=EmailTemplate.Status.choices,
        required=False,
        default=EmailTemplate.Status.ACTIVE,
    )
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    content = serializers.JSONField(required=False, default=dict)
    html_body = serializers.CharField(required=False, allow_blank=True, default="")
    translations = serializers.DictField(required=False, default=dict)
    variables = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
