"""CRUD Mẫu Email Tiptap & xem trước / nhân bản.

GET    /system/email-templates
POST   /system/email-templates
GET    /system/email-templates/{id}
PATCH  /system/email-templates/{id}
DELETE /system/email-templates/{id}
POST   /system/email-templates/bulk-update
POST   /system/email-templates/bulk-delete
GET    /system/email-templates/{id}/history
POST   /system/email-templates/{id}/duplicate
POST   /system/email-templates/{id}/preview
"""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.email_template_filter import EmailTemplateFilter
from app.system.models.email_template import EmailTemplate
from app.system.permissions.email_template_permission import EmailTemplatePermission as P
from app.system.serializers.responses.email_template_detail_response_serializer import (
    EmailTemplateDetailResponseSerializer,
)
from app.system.serializers.responses.email_template_list_response_serializer import (
    EmailTemplateListResponseSerializer,
)
from app.system.serializers.responses.email_template_preview_response_serializer import (
    EmailTemplatePreviewResponseSerializer,
)
from app.system.serializers.validates.email_template_bulk_update_validate_serializer import (
    EmailTemplateBulkUpdateValidateSerializer,
)
from app.system.serializers.validates.email_template_create_validate_serializer import (
    EmailTemplateCreateValidateSerializer,
)
from app.system.serializers.validates.email_template_preview_validate_serializer import (
    EmailTemplatePreviewValidateSerializer,
)
from app.system.serializers.validates.email_template_update_validate_serializer import (
    EmailTemplateUpdateValidateSerializer,
)
from app.system.services.email_template_service import EmailTemplateService
from app.system.types.permission_rule import permission_rule


class EmailTemplateViewSet(CoreModelViewSet[EmailTemplate]):
    """Mẫu email SYSTEM (Admin) & PERSONAL (Client Portal)."""

    service_class = EmailTemplateService
    service: EmailTemplateService
    filterset_class = EmailTemplateFilter
    search_fields = ("code", "name", "description", "subject")
    ordering_fields = (
        "name",
        "code",
        "scope",
        "category",
        "status",
        "locale",
        "created_at",
        "updated_at",
    )
    ordering = ("-is_system_default", "-updated_at", "-pk")
    list_serializer_class = EmailTemplateListResponseSerializer
    detail_serializer_class = EmailTemplateDetailResponseSerializer
    create_serializer_class = EmailTemplateCreateValidateSerializer
    update_serializer_class = EmailTemplateUpdateValidateSerializer
    bulk_update_serializer_class = EmailTemplateBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
        "duplicate": permission_rule(P.CREATE),
        "preview": permission_rule(P.READ),
    }

    @extend_schema(request=None, responses=EmailTemplateDetailResponseSerializer)
    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request: Request, pk: Any = None) -> CoreResponse:
        """Nhân bản mẫu hệ thống hoặc cá nhân thành mẫu cá nhân riêng."""
        item = self.service.duplicate(self.get_actor(request), pk)
        return CoreResponse(EmailTemplateDetailResponseSerializer(item).data, status=201)

    @extend_schema(
        request=EmailTemplatePreviewValidateSerializer,
        responses=EmailTemplatePreviewResponseSerializer,
    )
    @action(detail=True, methods=["post"], url_path="preview")
    def preview(self, request: Request, pk: Any = None) -> CoreResponse:
        """Xem trước nội dung email sau khi trộn biến dữ liệu mẫu."""
        serializer = EmailTemplatePreviewValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = self.service.preview(
            self.get_actor(request),
            pk,
            serializer.validated_data.get("sample_data") or {},
            locale=str(serializer.validated_data.get("locale") or "vi"),
        )
        return CoreResponse(EmailTemplatePreviewResponseSerializer(data).data)
