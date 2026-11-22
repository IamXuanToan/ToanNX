"""Response quy tắc nhận diện."""

from rest_framework import serializers

from app.finance.models.classification_rule import ClassificationRule


class ClassificationRuleResponseSerializer(serializers.ModelSerializer[ClassificationRule]):
    """Quy tắc."""

    platform_name = serializers.CharField(source="platform.name", read_only=True, help_text="Nền tảng.")

    class Meta:
        model = ClassificationRule
        fields = (
            "id",
            "name",
            "platform_id",
            "platform_name",
            "pattern",
            "priority",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
