"""Response Serializer cho Language."""

from rest_framework import serializers

from app.system.models.language import Language


class LanguageResponseSerializer(serializers.ModelSerializer[Language]):
    """Dữ liệu chi tiết/danh sách một ngôn ngữ."""

    class Meta:
        """Khai báo model và trường trả về."""

        model = Language
        fields = (
            "id",
            "code",
            "name",
            "native_name",
            "flag_emoji",
            "is_default",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        )
