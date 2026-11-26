"""Bộ lọc cho Phiên hội thoại Trợ lý AI."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.workspace.models.assistant_conversation import AssistantConversation


class AssistantConversationFilter(django_filters.FilterSet):
    """Lọc phiên hội thoại theo kênh tương tác và chủ sở hữu."""

    channel = CoreChoiceInFilter(
        choices=AssistantConversation.Channel.choices,
        help_text="Kênh tương tác (WEB, TELEGRAM_DM, TELEGRAM_GROUP).",
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id",
        help_text="ID chủ sở hữu (chỉ áp dụng khi có quyền manage_all).",
    )

    class Meta:
        model = AssistantConversation
        fields = ("channel", "owner")
