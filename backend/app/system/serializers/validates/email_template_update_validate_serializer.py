"""Validate cập nhật EmailTemplate."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.models.email_template import EmailTemplate


class EmailTemplateUpdateValidateSerializer(CoreValidateSerializer):
    """Input cập nhật từng phần mẫu email đa ngôn ngữ."""

    code = serializers.SlugField(max_length=80, required=False)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    description = serializers.CharField(max_length=300, required=False, allow_blank=True)
    locale = serializers.CharField(max_length=10, required=False)
    scope = serializers.ChoiceField(choices=EmailTemplate.Scope.choices, required=False)
    category = serializers.ChoiceField(choices=EmailTemplate.Category.choices, required=False)
    status = serializers.ChoiceField(choices=EmailTemplate.Status.choices, required=False)
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True)
    content = serializers.JSONField(required=False)
    html_body = serializers.CharField(required=False, allow_blank=True)
    translations = serializers.DictField(required=False)
    variables = serializers.ListField(child=serializers.DictField(), required=False)
